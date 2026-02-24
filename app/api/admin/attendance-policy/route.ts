import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { getActiveAttendancePolicy } from '@/lib/attendance-policy'
import { createAuditLog } from '@/lib/audit-log'

// GET - Get current attendance policy
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const policy = await getActiveAttendancePolicy()
    return NextResponse.json(policy)
  } catch (error: any) {
    console.error('Error fetching attendance policy:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update attendance policy (office start/end times only)
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { officeStartTime, officeEndTime } = body

    if (!officeStartTime || !officeEndTime) {
      return NextResponse.json({ error: 'Office start and end times are required' }, { status: 400 })
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(officeStartTime) || !timeRegex.test(officeEndTime)) {
      return NextResponse.json({ error: 'Invalid time format. Use HH:mm' }, { status: 400 })
    }

    const existingPolicy = await queryOne(`SELECT * FROM attendance_policies WHERE is_active = true`)

    // Deactivate all existing policies
    await query(`UPDATE attendance_policies SET is_active = false WHERE is_active = true`)

    // Insert new active policy (keep old columns with defaults for backward compatibility)
    const result = await query(
      `INSERT INTO attendance_policies
         (office_start_time, office_end_time, min_hours_full_day, min_hours_half_day, grace_period_minutes, is_active)
       VALUES ($1, $2, 8, 4, 0, true)
       RETURNING *`,
      [officeStartTime, officeEndTime]
    )

    const row = result.rows[0]

    await createAuditLog({
      actionType: 'POLICY_CHANGE',
      entityType: 'POLICY',
      entityId: row.id,
      userId: session.user.id,
      oldValues: existingPolicy
        ? { officeStartTime: existingPolicy.office_start_time, officeEndTime: existingPolicy.office_end_time }
        : undefined,
      newValues: { officeStartTime, officeEndTime },
      reason: 'Attendance policy updated',
      req,
    })

    return NextResponse.json({
      id: row.id,
      officeStartTime: row.office_start_time?.slice(0, 5),
      officeEndTime: row.office_end_time?.slice(0, 5),
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    })
  } catch (error: any) {
    console.error('Error updating attendance policy:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
