import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { calculateDays } from '@/lib/utils'
import { findLeaveRequestById, findLeaveBalance, findLeaveTypeById } from '@/lib/db-helpers'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leaveId = params.id
    const body = await req.json()
    const { startDate, endDate, reason } = body

    // Check if leave exists and belongs to user
    const leave = await findLeaveRequestById(leaveId)

    if (!leave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    if (leave.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can only edit pending leaves
    if (leave.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only edit pending leave requests' },
        { status: 400 }
      )
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    const calculatedDays = calculateDays(start, end)

    if (calculatedDays <= 0) {
      return NextResponse.json(
        { error: 'Invalid date range' },
        { status: 400 }
      )
    }

    // Check leave balance
    const currentYear = new Date().getFullYear()
    const balance = await findLeaveBalance(session.user.id, leave.leaveTypeId, currentYear)
    const leaveType = await findLeaveTypeById(leave.leaveTypeId)

    if (!leaveType) {
      return NextResponse.json(
        { error: 'Leave type not found' },
        { status: 404 }
      )
    }

    // Calculate available balance (add back the old days)
    const availableBalance = (balance?.balance ?? leaveType.maxDays) + parseFloat(leave.days)

    if (calculatedDays > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient leave balance. Available: ${availableBalance} days` },
        { status: 400 }
      )
    }

    // Update leave request
    const result = await query(
      `UPDATE leave_requests 
       SET start_date = $1, end_date = $2, days = $3, reason = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [start, end, calculatedDays, reason || null, leaveId]
    )

    return NextResponse.json(result.rows[0], { status: 200 })
  } catch (error: any) {
    console.error('Error updating leave request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leaveId = params.id

    // Check if leave exists and belongs to user
    const leave = await findLeaveRequestById(leaveId)

    if (!leave) {
      return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
    }

    if (leave.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Can only cancel pending leaves
    if (leave.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Can only cancel pending leave requests' },
        { status: 400 }
      )
    }

    // Update status to cancelled
    await query(
      `UPDATE leave_requests SET status = $1, updated_at = NOW() WHERE id = $2`,
      ['CANCELLED', leaveId]
    )

    return NextResponse.json({ message: 'Leave request cancelled' }, { status: 200 })
  } catch (error: any) {
    console.error('Error cancelling leave request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

