import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { getActiveAttendancePolicy, calculateWorkingHours } from '@/lib/attendance-policy'
import { createAuditLog } from '@/lib/audit-log'
import { createNotification } from '@/lib/notifications'

// PUT - Update attendance (HOD can update team, Admin can update anyone)
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['HOD', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only HOD and Admin can modify attendance' },
        { status: 403 }
      )
    }

    const routeParams = params instanceof Promise ? await params : params
    const { id } = routeParams
    const body = await req.json()
    const { checkIn, checkOut, status, remarks, overrideReason } = body

    // Get attendance record
    const attendance = await queryOne(
      `SELECT a.*, u.role as user_role, u.hod_id
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.id = $1`,
      [id]
    )

    if (!attendance) {
      return NextResponse.json(
        { error: 'Attendance record not found' },
        { status: 404 }
      )
    }

    // HOD can only edit team members, not themselves
    if (session.user.role === 'HOD') {
      if (attendance.user_id === session.user.id) {
        return NextResponse.json(
          { error: 'HOD cannot edit their own attendance' },
          { status: 403 }
        )
      }
      if (attendance.hod_id !== session.user.id) {
        return NextResponse.json(
          { error: 'You can only edit attendance of your team members' },
          { status: 403 }
        )
      }
    }

    // Admin must provide override reason
    if (session.user.role === 'ADMIN' && !overrideReason) {
      return NextResponse.json(
        { error: 'Override reason is required for Admin modifications' },
        { status: 400 }
      )
    }

    // Validate check-out is after check-in
    const finalCheckIn = checkIn !== undefined ? (checkIn ? new Date(checkIn) : null) : (attendance.check_in ? new Date(attendance.check_in) : null)
    const finalCheckOut = checkOut !== undefined ? (checkOut ? new Date(checkOut) : null) : (attendance.check_out ? new Date(attendance.check_out) : null)
    
    if (finalCheckIn && finalCheckOut && finalCheckOut <= finalCheckIn) {
      return NextResponse.json(
        { error: 'Check-out time must be after check-in time' },
        { status: 400 }
      )
    }

    // Get policy for recalculations
    const policy = await getActiveAttendancePolicy()
    if (!policy) {
      return NextResponse.json(
        { error: 'Attendance policy not configured' },
        { status: 500 }
      )
    }

    // Recalculate working hours when times are updated
    let finalWorkingHours = attendance.working_hours
    let finalStatus = status !== undefined ? status : attendance.status

    if (finalCheckOut && finalCheckIn) {
      finalWorkingHours = calculateWorkingHours(finalCheckIn, finalCheckOut)

      if (finalWorkingHours < 0) {
        return NextResponse.json(
          { error: 'Invalid time range: check-out must be after check-in' },
          { status: 400 }
        )
      }

      // If status not manually set, default to PRESENT
      if (status === undefined) {
        finalStatus = 'PRESENT'
      }
    } else if (finalCheckIn && !finalCheckOut) {
      finalWorkingHours = null
      if (status === undefined) {
        finalStatus = 'PRESENT'
      }
    }

    // Build update query
    const updates: string[] = []
    const queryParams: any[] = []
    let paramCount = 1

    // Create audit log
    await createAuditLog({
      actionType: 'ATTENDANCE_EDIT',
      entityType: 'ATTENDANCE',
      entityId: id,
      userId: session.user.id,
      oldValues: {
        checkIn: attendance.check_in,
        checkOut: attendance.check_out,
        status: attendance.status,
        workingHours: attendance.working_hours,
      },
      newValues: {
        checkIn: finalCheckIn,
        checkOut: finalCheckOut,
        status: finalStatus,
        workingHours: finalWorkingHours,
      },
      reason: overrideReason || (session.user.role === 'HOD' ? 'HOD correction' : 'Admin override'),
      req,
    })

    // Also log to attendance_audit_log for backward compatibility
    if (session.user.role === 'ADMIN') {
      try {
        await query(
          `INSERT INTO attendance_audit_log (attendance_id, modified_by, old_status, new_status, reason, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [id, session.user.id, attendance.status, finalStatus, overrideReason]
        )
      } catch (auditErr: any) {
        // Non-fatal: audit log failure should not block the override
        console.error('attendance_audit_log insert failed (non-fatal):', auditErr.message)
      }
      updates.push(`marked_by = 'ADMIN'`)
    } else if (session.user.role === 'HOD') {
      updates.push(`marked_by = 'HOD'`)
    }

    // Create notification for user if attendance was edited
    await createNotification({
      userId: attendance.user_id,
      type: 'ATTENDANCE_EDITED',
      title: 'Attendance Updated',
      message: `Your attendance for ${new Date(attendance.date).toLocaleDateString()} has been updated by ${session.user.role === 'ADMIN' ? 'Admin' : 'HOD'}.${overrideReason ? ` Reason: ${overrideReason}` : ''}`,
      relatedEntityType: 'ATTENDANCE',
      relatedEntityId: id,
    })

    if (checkIn !== undefined) {
      updates.push(`check_in = $${paramCount++}`)
      queryParams.push(finalCheckIn)
    }

    if (checkOut !== undefined) {
      updates.push(`check_out = $${paramCount++}`)
      queryParams.push(finalCheckOut)
    }

    // Update working hours if check-in or check-out changed
    if (checkIn !== undefined || checkOut !== undefined) {
      updates.push(`working_hours = $${paramCount++}`)
      queryParams.push(finalWorkingHours)
    }

    if (status !== undefined) {
      updates.push(`status = $${paramCount++}`)
      queryParams.push(finalStatus)
    } else if (checkIn !== undefined || checkOut !== undefined) {
      // Auto-update status if times changed but status wasn't explicitly set
      updates.push(`status = $${paramCount++}`)
      queryParams.push(finalStatus)
    }

    if (remarks !== undefined) {
      updates.push(`remarks = $${paramCount++}`)
      queryParams.push(remarks || null)
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'No fields to update' },
        { status: 400 }
      )
    }

    updates.push(`updated_at = NOW()`)
    queryParams.push(id)

    const sql = `UPDATE attendance SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`
    const result = await query(sql, queryParams)

    return NextResponse.json({
      ...result.rows[0],
      workingHours: finalWorkingHours,
      status: finalStatus,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error updating attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

