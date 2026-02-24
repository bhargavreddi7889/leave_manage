import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
// POST - Check in → status always becomes PRESENT
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const now = new Date()

    // Check if already checked in today
    const existing = await queryOne(
      `SELECT * FROM attendance WHERE user_id = $1 AND date = $2`,
      [session.user.id, today]
    )

    if (existing) {
      if (existing.check_in) {
        return NextResponse.json({ error: 'You have already checked in today' }, { status: 400 })
      }

      // Record was pre-created (e.g. ON_LEAVE by SYSTEM) — block check-in
      if (existing.status === 'ON_LEAVE' && existing.marked_by === 'SYSTEM') {
        return NextResponse.json(
          { error: 'You are on approved leave today. Cannot check in.' },
          { status: 400 }
        )
      }

      // Update existing record
      const result = await query(
        `UPDATE attendance
         SET check_in = $1, status = 'PRESENT', marked_by = 'USER', updated_at = NOW()
         WHERE user_id = $2 AND date = $3
         RETURNING *`,
        [now, session.user.id, today]
      )
      return NextResponse.json(result.rows[0], { status: 200 })
    }

    // Check for approved leave today
    const leaveCheck = await queryOne(
      `SELECT lr.*, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.user_id = $1
         AND lr.status = 'APPROVED'
         AND lr.start_date <= $2
         AND lr.end_date >= $2`,
      [session.user.id, today]
    )

    if (leaveCheck) {
      return NextResponse.json(
        { error: `You are on ${leaveCheck.leave_type_name} leave today. Cannot check in.` },
        { status: 400 }
      )
    }

    // Create new attendance record — PRESENT immediately on check-in
    const result = await query(
      `INSERT INTO attendance (user_id, date, check_in, status, marked_by)
       VALUES ($1, $2, $3, 'PRESENT', 'USER')
       RETURNING *`,
      [session.user.id, today, now]
    )

    return NextResponse.json(result.rows[0], { status: 201 })
  } catch (error: any) {
    console.error('Error checking in:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
