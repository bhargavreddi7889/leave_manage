import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { calculateWorkingHours } from '@/lib/attendance-policy'

// POST - Check out → records timestamp, calculates working hours (informational), keeps PRESENT
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const now = new Date()

    const existing = await queryOne(
      `SELECT * FROM attendance WHERE user_id = $1 AND date = $2`,
      [session.user.id, today]
    )

    if (!existing || !existing.check_in) {
      return NextResponse.json(
        { error: 'You must check in before checking out' },
        { status: 400 }
      )
    }

    if (existing.check_out) {
      return NextResponse.json(
        { error: 'You have already checked out today' },
        { status: 400 }
      )
    }

    const checkInTime = new Date(existing.check_in)
    if (now <= checkInTime) {
      return NextResponse.json(
        { error: 'Check-out time must be after check-in time' },
        { status: 400 }
      )
    }

    const workingHours = calculateWorkingHours(checkInTime, now)

    const result = await query(
      `UPDATE attendance
       SET check_out = $1, working_hours = $2, status = 'PRESENT', updated_at = NOW()
       WHERE user_id = $3 AND date = $4 AND (marked_by = 'USER' OR marked_by IS NULL)
       RETURNING *`,
      [now, workingHours, session.user.id, today]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cannot check out. Attendance was marked by system.' },
        { status: 400 }
      )
    }

    return NextResponse.json({
      ...result.rows[0],
      workingHours,
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error checking out:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
