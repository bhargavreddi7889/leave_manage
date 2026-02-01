import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { calculateDays } from '@/lib/utils'
import { updateLeaveBalance, initializeLeaveBalances } from '@/lib/leave-calculations'
import { findLeaveBalance, findLeaveTypeById, findLeaveRequests, findUserById } from '@/lib/db-helpers'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has a HOD assigned (for employees)
    if (session.user.role === 'EMPLOYEE') {
      const user = await findUserById(session.user.id)
      if (!user?.hodId) {
        return NextResponse.json(
          { error: 'You cannot apply for leave until a reporting HOD is assigned. Please contact your administrator.' },
          { status: 400 }
        )
      }
    }

    const body = await req.json()
    const { leaveTypeId, startDate, endDate, reason, days } = body

    if (!leaveTypeId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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
    const balance = await findLeaveBalance(session.user.id, leaveTypeId, currentYear)
    const leaveType = await findLeaveTypeById(leaveTypeId)

    if (!leaveType) {
      return NextResponse.json(
        { error: 'Leave type not found' },
        { status: 404 }
      )
    }

    const availableBalance = balance?.balance ?? leaveType.maxDays

    if (calculatedDays > availableBalance) {
      return NextResponse.json(
        { error: `Insufficient leave balance. Available: ${availableBalance} days` },
        { status: 400 }
      )
    }

    // Initialize balance if not exists
    if (!balance) {
      await initializeLeaveBalances(session.user.id, currentYear)
    }

    // Create leave request
    const result = await query(
      `INSERT INTO leave_requests (user_id, leave_type_id, start_date, end_date, days, reason, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [session.user.id, leaveTypeId, start, end, calculatedDays, reason || null, 'PENDING']
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error('Error creating leave request:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Filter out soft-deleted records in all queries

    const leaves = await findLeaveRequests({ userId: session.user.id })

    return NextResponse.json(leaves)
  } catch (error: any) {
    console.error('Error fetching leaves:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

