import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'
import { getActiveAttendancePolicy, isEarlyExit, calculateWorkingHours, determineAttendanceStatus } from '@/lib/attendance-policy'
import { isAttendanceEnabled } from '@/lib/attendance-control'

// POST - Check out
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

    // Check if checked in today
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

    // Validate check-out is after check-in
    const checkInTime = new Date(existing.check_in)
    if (now <= checkInTime) {
      return NextResponse.json(
        { error: 'Check-out time must be after check-in time' },
        { status: 400 }
      )
    }

    // Get attendance policy (with error handling)
    let policy
    let isEarly = false
    let status = 'PRESENT'
    const workingHours = calculateWorkingHours(checkInTime, now)
    
    try {
      policy = await getActiveAttendancePolicy()
      
      if (policy) {
        isEarly = isEarlyExit(now, policy)
        status = determineAttendanceStatus(workingHours, policy)
      } else {
        // Default status calculation if no policy
        if (workingHours >= 7.0) {
          status = 'PRESENT'
        } else if (workingHours >= 4.0) {
          status = 'HALF_DAY'
        } else {
          status = 'ABSENT'
        }
      }
    } catch (error) {
      console.error('Error getting attendance policy:', error)
      // Use default calculations if policy fetch fails
      if (workingHours >= 7.0) {
        status = 'PRESENT'
      } else if (workingHours >= 4.0) {
        status = 'HALF_DAY'
      } else {
        status = 'ABSENT'
      }
    }

    // Update attendance with check-out (only if marked by USER, not SYSTEM)
    const result = await query(
      `UPDATE attendance 
       SET check_out = $1, status = $2, is_early_exit = $3, working_hours = $4, updated_at = NOW()
       WHERE user_id = $5 AND date = $6 AND (marked_by = 'USER' OR marked_by IS NULL)
       RETURNING *`,
      [now, status, isEarly, workingHours, session.user.id, today]
    )

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Cannot check out. Attendance was marked by system (on leave).' },
        { status: 400 }
      )
    }

    return NextResponse.json({ 
      ...result.rows[0], 
      isEarlyExit: isEarly,
      workingHours: workingHours 
    }, { status: 200 })
  } catch (error: any) {
    console.error('Error checking out:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

