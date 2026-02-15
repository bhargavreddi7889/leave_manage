import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { createAuditLog } from '@/lib/audit-log'

/**
 * GET - Get old Earn Leave balance for a user
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const user = await queryOne(
      `SELECT id, first_name, last_name, employee_id, old_earn_leave_balance 
       FROM users WHERE id = $1`,
      [userId]
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      userId: user.id,
      name: `${user.first_name} ${user.last_name}`,
      employeeId: user.employee_id,
      oldEarnLeaveBalance: parseFloat(user.old_earn_leave_balance || '0')
    })
  } catch (error: any) {
    console.error('Error fetching old Earn Leave balance:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT - Update old Earn Leave balance for a user
 */
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { userId, oldEarnLeaveBalance } = body

    if (!userId || oldEarnLeaveBalance === undefined) {
      return NextResponse.json(
        { error: 'User ID and old Earn Leave balance are required' },
        { status: 400 }
      )
    }

    if (oldEarnLeaveBalance < 0) {
      return NextResponse.json(
        { error: 'Old Earn Leave balance cannot be negative' },
        { status: 400 }
      )
    }

    // Get current user data for audit log
    const currentUser = await queryOne(
      `SELECT id, first_name, last_name, employee_id, old_earn_leave_balance 
       FROM users WHERE id = $1`,
      [userId]
    )

    if (!currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const oldBalance = parseFloat(currentUser.old_earn_leave_balance || '0')

    // Update old Earn Leave balance
    await query(
      `UPDATE users 
       SET old_earn_leave_balance = $1, updated_at = NOW()
       WHERE id = $2`,
      [oldEarnLeaveBalance, userId]
    )

    // Create audit log
    await createAuditLog({
      actionType: 'EARN_LEAVE_BALANCE_UPDATE',
      entityType: 'USER',
      entityId: userId,
      userId: session.user.id,
      oldValues: { oldEarnLeaveBalance: oldBalance },
      newValues: { oldEarnLeaveBalance },
      reason: `Updated old Earn Leave balance for ${currentUser.first_name} ${currentUser.last_name}`,
      req,
    })

    return NextResponse.json({
      success: true,
      message: 'Old Earn Leave balance updated successfully',
      userId,
      oldEarnLeaveBalance
    })
  } catch (error: any) {
    console.error('Error updating old Earn Leave balance:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

