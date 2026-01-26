import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { updateLeaveBalance } from '@/lib/leave-calculations'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only managers can approve/reject leaves (admin can only view)
    if (session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only managers can approve or reject leave requests' },
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
      `SELECT lr.*, u.manager_id as user_manager_id
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

    // Check if manager has permission to approve this leave
    if (leaveRequest.user_manager_id !== session.user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to approve this leave' },
        { status: 403 }
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

      // Update leave request
      await query(
        `UPDATE leave_requests 
         SET status = $1, approved_by_id = $2, approved_at = NOW(), updated_at = NOW()
         WHERE id = $3`,
        ['APPROVED', session.user.id, id]
      )
    } else {
      // Reject leave request
      await query(
        `UPDATE leave_requests 
         SET status = $1, approved_by_id = $2, approved_at = NOW(), rejection_reason = $3, updated_at = NOW()
         WHERE id = $4`,
        ['REJECTED', session.user.id, reason || null, id]
      )
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

