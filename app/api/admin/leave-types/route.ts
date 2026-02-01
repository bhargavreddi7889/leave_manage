import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query } from '@/lib/db'
import { createAuditLog } from '@/lib/audit-log'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, type, maxDays, carryForward } = body

    if (!name || !type || !maxDays) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const result = await query(
      `INSERT INTO leave_types (name, type, max_days, carry_forward)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, type, parseInt(maxDays), carryForward || false]
    )

    const newLeaveType = result.rows[0]

    // Create audit log
    await createAuditLog({
      actionType: 'LEAVE_TYPE_CREATE',
      entityType: 'LEAVE_TYPE',
      entityId: newLeaveType.id,
      userId: session.user.id,
      oldValues: undefined,
      newValues: {
        name,
        type,
        maxDays: parseInt(maxDays),
        carryForward: carryForward || false,
      },
      reason: 'Leave type created',
      req,
    })

    return NextResponse.json(newLeaveType, { status: 201 })
  } catch (error: any) {
    console.error('Error creating leave type:', error)
    if (error.code === '23505') { // PostgreSQL unique violation
      return NextResponse.json(
        { error: 'Leave type name already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

