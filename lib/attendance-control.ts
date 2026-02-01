import { query, queryOne } from './db'

export interface AttendanceControl {
  id: string
  isEnabled: boolean
  enabledAt: Date | null
  enabledBy: string | null
  disabledAt: Date | null
  disabledBy: string | null
  createdAt: Date
  updatedAt: Date
}

export async function getAttendanceControl(): Promise<AttendanceControl | null> {
  try {
    const result = await queryOne(
      `SELECT * FROM attendance_control ORDER BY updated_at DESC LIMIT 1`
    )

    if (!result) {
      return null
    }

    return {
      id: result.id,
      isEnabled: result.is_enabled,
      enabledAt: result.enabled_at ? new Date(result.enabled_at) : null,
      enabledBy: result.enabled_by,
      disabledAt: result.disabled_at ? new Date(result.disabled_at) : null,
      disabledBy: result.disabled_by,
      createdAt: new Date(result.created_at),
      updatedAt: new Date(result.updated_at),
    }
  } catch (error) {
    console.error('Error fetching attendance control:', error)
    return null
  }
}

export async function toggleAttendanceControl(enabled: boolean, userId: string): Promise<boolean> {
  try {
    const existing = await getAttendanceControl()
    
    if (existing) {
      await query(
        `UPDATE attendance_control 
         SET is_enabled = $1, 
             ${enabled ? 'enabled_at = NOW(), enabled_by = $2, disabled_at = NULL, disabled_by = NULL' : 'disabled_at = NOW(), disabled_by = $2, enabled_at = NULL, enabled_by = NULL'},
             updated_at = NOW()
         WHERE id = $3`,
        [enabled, userId, existing.id]
      )
    } else {
      await query(
        `INSERT INTO attendance_control (is_enabled, ${enabled ? 'enabled_at, enabled_by' : 'disabled_at, disabled_by'})
         VALUES ($1, NOW(), $2)`,
        [enabled, userId]
      )
    }

    return true
  } catch (error) {
    console.error('Error toggling attendance control:', error)
    return false
  }
}

export async function isAttendanceEnabled(): Promise<boolean> {
  try {
    const control = await getAttendanceControl()
    return control?.isEnabled || false
  } catch (error) {
    console.error('Error checking attendance control:', error)
    return false
  }
}

