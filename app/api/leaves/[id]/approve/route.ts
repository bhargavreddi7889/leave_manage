import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { updateLeaveBalance } from '@/lib/leave-calculations'
import { findLeaveTypeById } from '@/lib/db-helpers'
import { createAuditLog } from '@/lib/audit-log'
import { createNotification } from '@/lib/notifications'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Approval hierarchy: HOD approves Employee leaves, Admin approves HOD leaves
    if (!['HOD', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Only HOD or Admin can approve or reject leave requests' },
        { status: 403 }
      )
    }

    const routeParams = params instanceof Promise ? await params : params
    const { id } = routeParams
    const body = await req.json()
    const { action, reason } = body

    if (action !== 'approve' && action !== 'reject') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      )
    }

    const leaveRequest = await queryOne(
      `SELECT lr.*, u.hod_id as user_hod_id, u.role as requester_role
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       WHERE lr.id = $1`,
      [id]
    )

    if (!leaveRequest) {
      return NextResponse.json(
        { error: 'Leave request not found' },
        { status: 404 }
      )
    }

    if (leaveRequest.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Leave request is not pending' },
        { status: 400 }
      )
    }

    // Approval hierarchy: HOD approves Employee leaves, Admin approves HOD leaves
    if (leaveRequest.requester_role === 'EMPLOYEE') {
      // Employee leaves must be approved by their HOD
      if (session.user.role !== 'HOD' || leaveRequest.user_hod_id !== session.user.id) {
        return NextResponse.json(
          { error: 'Only the assigned HOD can approve this employee leave request' },
          { status: 403 }
        )
      }
    } else if (leaveRequest.requester_role === 'HOD') {
      // HOD leaves must be approved by Admin
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Only Admin can approve HOD leave requests' },
          { status: 403 }
        )
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid leave request' },
        { status: 400 }
      )
    }

    const currentYear = new Date().getFullYear()

    if (action === 'approve') {
      // Update leave balance - map snake_case to camelCase
      await updateLeaveBalance(
        leaveRequest.user_id,
        leaveRequest.leave_type_id,
        parseFloat(leaveRequest.days || '0'),
        currentYear
      )

      // Create audit log before update
      await createAuditLog({
        actionType: 'LEAVE_APPROVAL',
        entityType: 'LEAVE_REQUEST',
        entityId: id,
        userId: session.user.id,
        oldValues: { status: leaveRequest.status },
        newValues: { status: 'APPROVED', approvedBy: session.user.id },
        reason: reason || 'Leave approved',
        req,
      })

      // Update leave request
      await query(
        `UPDATE leave_requests 
         SET status = $1, approved_by_id = $2, approved_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        ['APPROVED', session.user.id, id]
      )

      // Get leave type name for remarks and notification
      const leaveType = await findLeaveTypeById(leaveRequest.leave_type_id)
      const leaveTypeName = leaveType?.name || 'Leave'

      // Create notification for user
      await createNotification({
        userId: leaveRequest.user_id,
        type: 'LEAVE_APPROVED',
        title: 'Leave Approved',
        message: `Your ${leaveTypeName} request from ${new Date(leaveRequest.start_date).toLocaleDateString()} to ${new Date(leaveRequest.end_date).toLocaleDateString()} has been approved.`,
        relatedEntityType: 'LEAVE_REQUEST',
        relatedEntityId: id,
      })
      
      // Update attendance for all dates in the leave period
      const startDate = new Date(leaveRequest.start_date)
      const endDate = new Date(leaveRequest.end_date)
      
      // Iterate through each date in the leave period
      for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateOnly = new Date(date)
        dateOnly.setHours(0, 0, 0, 0)
        
        // Check if attendance already exists for this date
        const existingAttendance = await queryOne(
          `SELECT id, status, marked_by FROM attendance WHERE user_id = $1 AND date = $2`,
          [leaveRequest.user_id, dateOnly]
        )

        if (existingAttendance) {
          // If attendance exists and was marked by USER (not SYSTEM), update it to ON_LEAVE
          if (existingAttendance.marked_by === 'USER' || existingAttendance.marked_by === null) {
            await query(
              `UPDATE attendance 
               SET status = 'ON_LEAVE', marked_by = 'SYSTEM', 
               remarks = COALESCE(remarks || '; ', '') || $1, updated_at = NOW()
               WHERE id = $2`,
              [`Auto-updated: ${leaveTypeName} approved`, existingAttendance.id]
            )
          }
        } else {
          // Create new attendance record for leave
          await query(
            `INSERT INTO attendance (user_id, date, status, marked_by, remarks)
             VALUES ($1, $2, 'ON_LEAVE', 'SYSTEM', $3)`,
            [leaveRequest.user_id, dateOnly, `Auto-filled from ${leaveTypeName} leave`]
          )
        }
      }
    } else {
      // Create audit log before update
      await createAuditLog({
        actionType: 'LEAVE_REJECTION',
        entityType: 'LEAVE_REQUEST',
        entityId: id,
        userId: session.user.id,
        oldValues: { status: leaveRequest.status },
        newValues: { status: 'REJECTED', rejectedBy: session.user.id },
        reason: reason || 'Leave rejected',
        req,
      })

      // Reject leave request
      await query(
        `UPDATE leave_requests 
         SET status = $1, approved_by_id = $2, approved_at = NOW(), rejection_reason = $3, updated_at = NOW()
         WHERE id = $4`,
        ['REJECTED', session.user.id, reason || null, id]
      )

      // Create notification for user
      const leaveType = await findLeaveTypeById(leaveRequest.leave_type_id)
      await createNotification({
        userId: leaveRequest.user_id,
        type: 'LEAVE_REJECTED',
        title: 'Leave Rejected',
        message: `Your ${leaveType?.name || 'leave'} request from ${new Date(leaveRequest.start_date).toLocaleDateString()} to ${new Date(leaveRequest.end_date).toLocaleDateString()} has been rejected.${reason ? ` Reason: ${reason}` : ''}`,
        relatedEntityType: 'LEAVE_REQUEST',
        relatedEntityId: id,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error approving/rejecting leave:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

