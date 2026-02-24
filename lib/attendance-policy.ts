import { queryOne } from './db'

export interface AttendancePolicy {
  id: string
  officeStartTime: string // HH:mm format
  officeEndTime: string   // HH:mm format
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

/**
 * Get the active attendance policy (office hours only).
 */
export async function getActiveAttendancePolicy(): Promise<AttendancePolicy | null> {
  try {
    const policy = await queryOne(
      `SELECT * FROM attendance_policies WHERE is_active = true ORDER BY updated_at DESC LIMIT 1`
    )

    if (!policy) {
      return {
        id: '',
        officeStartTime: '10:00',
        officeEndTime: '18:00',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    }

    const startTime = policy.office_start_time
      ? (typeof policy.office_start_time === 'string' ? policy.office_start_time.slice(0, 5) : '10:00')
      : '10:00'
    const endTime = policy.office_end_time
      ? (typeof policy.office_end_time === 'string' ? policy.office_end_time.slice(0, 5) : '18:00')
      : '18:00'

    return {
      id: policy.id,
      officeStartTime: startTime,
      officeEndTime: endTime,
      isActive: policy.is_active,
      createdAt: new Date(policy.created_at),
      updatedAt: new Date(policy.updated_at),
    }
  } catch (error) {
    console.error('Error fetching attendance policy:', error)
    return {
      id: '',
      officeStartTime: '10:00',
      officeEndTime: '18:00',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  }
}

/**
 * Calculate working hours between check-in and check-out (informational only).
 */
export function calculateWorkingHours(checkIn: Date, checkOut: Date): number {
  if (!checkIn || !checkOut) return 0
  const diffMs = checkOut.getTime() - checkIn.getTime()
  return Math.max(0, diffMs / (1000 * 60 * 60))
}
