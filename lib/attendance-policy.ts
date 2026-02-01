import { queryOne } from './db'

export interface AttendancePolicy {
  id: string
  officeStartTime: string // HH:mm format
  officeEndTime: string // HH:mm format
  minHoursFullDay: number
  minHoursHalfDay: number
  gracePeriodMinutes: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Get the active attendance policy
 */
export async function getActiveAttendancePolicy(): Promise<AttendancePolicy | null> {
  try {
    const policy = await queryOne(
      `SELECT * FROM attendance_policies WHERE is_active = true ORDER BY updated_at DESC LIMIT 1`
    )

    if (!policy) {
      // Return default policy if none exists
      return {
        id: '',
        officeStartTime: '10:00',
        officeEndTime: '17:00',
        minHoursFullDay: 7.0,
        minHoursHalfDay: 4.0,
        gracePeriodMinutes: 0,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    // Handle TIME format from PostgreSQL (HH:mm:ss)
    const startTime = policy.office_start_time ? 
      (typeof policy.office_start_time === 'string' ? policy.office_start_time.slice(0, 5) : '10:00') : 
      '10:00'
    const endTime = policy.office_end_time ? 
      (typeof policy.office_end_time === 'string' ? policy.office_end_time.slice(0, 5) : '17:00') : 
      '17:00'

    return {
      id: policy.id,
      officeStartTime: startTime,
      officeEndTime: endTime,
      minHoursFullDay: parseFloat(policy.min_hours_full_day || '7.0'),
      minHoursHalfDay: parseFloat(policy.min_hours_half_day || '4.0'),
      gracePeriodMinutes: parseInt(policy.grace_period_minutes || '0'),
      isActive: policy.is_active,
      createdAt: new Date(policy.created_at),
      updatedAt: new Date(policy.updated_at),
    }
  } catch (error) {
    console.error('Error fetching attendance policy:', error)
    // Return default policy on error
    return {
      id: '',
      officeStartTime: '10:00',
      officeEndTime: '17:00',
      minHoursFullDay: 7.0,
      minHoursHalfDay: 4.0,
      gracePeriodMinutes: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
}

/**
 * Check if check-in time is late based on policy
 */
export function isLateEntry(checkInTime: Date, policy: AttendancePolicy): boolean {
  // Handle both HH:mm and HH:mm:ss formats
  const timeParts = policy.officeStartTime.split(':')
  const hours = parseInt(timeParts[0])
  const minutes = parseInt(timeParts[1])
  
  const officeStart = new Date(checkInTime)
  officeStart.setHours(hours, minutes, 0, 0)

  const gracePeriodMs = policy.gracePeriodMinutes * 60 * 1000
  const allowedStart = new Date(officeStart.getTime() + gracePeriodMs)

  return checkInTime > allowedStart
}

/**
 * Check if check-out time is early based on policy
 */
export function isEarlyExit(checkOutTime: Date, policy: AttendancePolicy): boolean {
  // Handle both HH:mm and HH:mm:ss formats
  const timeParts = policy.officeEndTime.split(':')
  const hours = parseInt(timeParts[0])
  const minutes = parseInt(timeParts[1])
  
  const officeEnd = new Date(checkOutTime)
  officeEnd.setHours(hours, minutes, 0, 0)

  const gracePeriodMs = policy.gracePeriodMinutes * 60 * 1000
  const allowedEnd = new Date(officeEnd.getTime() - gracePeriodMs)

  return checkOutTime < allowedEnd
}

/**
 * Calculate working hours from check-in and check-out
 */
export function calculateWorkingHours(checkIn: Date, checkOut: Date): number {
  if (!checkIn || !checkOut) {
    return 0
  }
  const diffMs = checkOut.getTime() - checkIn.getTime()
  const hours = diffMs / (1000 * 60 * 60) // Convert to hours
  // Return 0 if negative (shouldn't happen, but safety check)
  return Math.max(0, hours)
}

/**
 * Determine attendance status based on working hours and policy
 */
export function determineAttendanceStatus(
  workingHours: number,
  policy: AttendancePolicy
): 'PRESENT' | 'HALF_DAY' | 'ABSENT' {
  if (workingHours >= policy.minHoursFullDay) {
    return 'PRESENT'
  } else if (workingHours >= policy.minHoursHalfDay) {
    return 'HALF_DAY'
  } else {
    return 'ABSENT'
  }
}

