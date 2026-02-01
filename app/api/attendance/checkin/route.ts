import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { getActiveAttendancePolicy, isLateEntry } from '@/lib/attendance-policy'
import { isAttendanceEnabled } from '@/lib/attendance-control'

// POST - Check in
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if attendance is enabled
    const attendanceEnabled = await isAttendanceEnabled()
    if (!attendanceEnabled) {
      return NextResponse.json(
        { error: 'Attendance system is currently disabled. Please contact your administrator.' },
        { status: 403 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const now = new Date()

    // Check if already checked in today
    const existing = await queryOne(
      `SELECT * FROM attendance WHERE user_id = $1 AND date = $2`,
      [session.user.id, today]
    )

    // Get attendance policy (with error handling)
    let policy
    let isLate = false
    
    try {
      policy = await getActiveAttendancePolicy()
      
      if (policy) {
        isLate = isLateEntry(now, policy)
      }
    } catch (error) {
      console.error('Error getting attendance policy:', error)
      // Continue with default values if policy fetch fails
    }

    if (existing) {
      if (existing.check_in) {
        return NextResponse.json(
          { error: 'You have already checked in today' },
          { status: 400 }
        )
      }
      
      // If attendance was marked as ON_LEAVE by SYSTEM, don't allow check-in
      if (existing.status === 'ON_LEAVE' && existing.marked_by === 'SYSTEM') {
        return NextResponse.json(
          { error: 'You are on approved leave today. Cannot check in.' },
          { status: 400 }
        )
      }
      
      // Update existing record with check-in
      const result = await query(
        `UPDATE attendance 
         SET check_in = $1, status = 'PRESENT', is_late_entry = $2, marked_by = 'USER', updated_at = NOW()
         WHERE user_id = $3 AND date = $4
         RETURNING *`,
        [now, isLate, session.user.id, today]
      )
      return NextResponse.json({ ...result.rows[0], isLateEntry: isLate }, { status: 200 })
    }

    // Check if user has approved leave for today
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

    // Create new attendance record
    const result = await query(
      `INSERT INTO attendance (user_id, date, check_in, status, marked_by, is_late_entry)
       VALUES ($1, $2, $3, 'PRESENT', 'USER', $4)
       RETURNING *`,
      [session.user.id, today, now, isLate]
    )

    return NextResponse.json({ ...result.rows[0], isLateEntry: isLate }, { status: 201 })
  } catch (error: any) {
    console.error('Error checking in:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

