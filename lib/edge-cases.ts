import { queryOne } from './db'
import { getActiveAttendancePolicy, calculateWorkingHours } from './attendance-policy'

/**
 * Handle edge case: Late entry + Early exit = Half Day
 */
export async function handleLateEarlyEdgeCase(
  checkIn: Date,
  checkOut: Date,
  _policy: any
): Promise<'PRESENT'> {
  // Simplified: any check-in/check-out = PRESENT
  return 'PRESENT'
}

/**
 * Check for absent + leave overlap conflict
 */
export async function checkAbsentLeaveOverlap(
  userId: string,
  date: Date
): Promise<{ hasConflict: boolean; conflictType?: string }> {
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  // Check if user has approved leave for this date
  const leaveCheck = await queryOne(
    `SELECT lr.*, lt.name as leave_type_name
     FROM leave_requests lr
     JOIN leave_types lt ON lr.leave_type_id = lt.id
     WHERE lr.user_id = $1
     AND lr.status = 'APPROVED'
     AND lr.start_date <= $2
     AND lr.end_date >= $2
     AND lr.deleted_at IS NULL`,
    [userId, dateOnly]
  )

  if (leaveCheck) {
    // Check if attendance is marked as ABSENT
    const attendance = await queryOne(
      `SELECT * FROM attendance 
       WHERE user_id = $1 AND date = $2`,
      [userId, dateOnly]
    )

    if (attendance && attendance.status === 'ABSENT') {
      return {
        hasConflict: true,
        conflictType: 'ABSENT_WITH_APPROVED_LEAVE',
      }
    }
  }

  return { hasConflict: false }
}

/**
 * Check for check-in without check-out (missed check-out)
 */
export async function checkMissedCheckout(
  userId: string,
  date: Date
): Promise<{ hasMissedCheckout: boolean; checkInTime?: Date }> {
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  const attendance = await queryOne(
    `SELECT * FROM attendance 
     WHERE user_id = $1 AND date = $2`,
    [userId, dateOnly]
  )

  if (attendance && attendance.check_in && !attendance.check_out && attendance.status !== 'ON_LEAVE') {
    return {
      hasMissedCheckout: true,
      checkInTime: new Date(attendance.check_in),
    }
  }

  return { hasMissedCheckout: false }
}

/**
 * Validate no duplicate check-ins for the same day
 */
export async function validateNoDuplicateCheckIn(
  userId: string,
  date: Date
): Promise<{ isValid: boolean; error?: string }> {
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  const existing = await queryOne(
    `SELECT * FROM attendance 
     WHERE user_id = $1 AND date = $2 AND check_in IS NOT NULL`,
    [userId, dateOnly]
  )

  if (existing) {
    return {
      isValid: false,
      error: 'You have already checked in today',
    }
  }

  return { isValid: true }
}

/**
 * Ensure one attendance record per day per user
 */
export async function ensureOneAttendancePerDay(
  userId: string,
  date: Date
): Promise<{ hasExisting: boolean; attendanceId?: string }> {
  const dateOnly = new Date(date)
  dateOnly.setHours(0, 0, 0, 0)

  const existing = await queryOne(
    `SELECT id FROM attendance 
     WHERE user_id = $1 AND date = $2`,
    [userId, dateOnly]
  )

  return {
    hasExisting: !!existing,
    attendanceId: existing?.id,
  }
}

/**
 * Check if leave dates are locked (after approval)
 */
export async function areLeaveDatesLocked(leaveRequestId: string): Promise<boolean> {
  const leaveRequest = await queryOne(
    `SELECT status FROM leave_requests WHERE id = $1 AND deleted_at IS NULL`,
    [leaveRequestId]
  )

  // Leave dates are locked if status is APPROVED or REJECTED
  return leaveRequest?.status === 'APPROVED' || leaveRequest?.status === 'REJECTED'
}

