import { query } from './db'
import { NextRequest } from 'next/server'

export type AuditActionType = 
  | 'ATTENDANCE_EDIT'
  | 'LEAVE_APPROVAL'
  | 'LEAVE_REJECTION'
  | 'POLICY_CHANGE'
  | 'EMPLOYEE_CREATE'
  | 'EMPLOYEE_UPDATE'
  | 'EMPLOYEE_DELETE'
  | 'LEAVE_TYPE_CREATE'
  | 'LEAVE_TYPE_UPDATE'
  | 'LEAVE_TYPE_DELETE'
  | 'ATTENDANCE_CONTROL_TOGGLE'
  | 'EARN_LEAVE_BALANCE_UPDATE'

export type AuditEntityType = 
  | 'ATTENDANCE'
  | 'LEAVE_REQUEST'
  | 'POLICY'
  | 'EMPLOYEE'
  | 'LEAVE_TYPE'
  | 'ATTENDANCE_CONTROL'
  | 'USER'

interface AuditLogParams {
  actionType: AuditActionType
  entityType: AuditEntityType
  entityId?: string
  userId: string
  oldValues?: Record<string, any>
  newValues?: Record<string, any>
  reason?: string
  req?: NextRequest
}

export async function createAuditLog(params: AuditLogParams) {
  try {
    let ipAddress: string | null = null
    let userAgent: string | null = null

    if (params.req) {
      ipAddress = params.req.headers.get('x-forwarded-for') || 
                  params.req.headers.get('x-real-ip') || 
                  'unknown'
      userAgent = params.req.headers.get('user-agent') || null
    }

    await query(
      `INSERT INTO audit_logs (
        action_type, entity_type, entity_id, user_id, 
        old_values, new_values, reason, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        params.actionType,
        params.entityType,
        params.entityId || null,
        params.userId,
        params.oldValues ? JSON.stringify(params.oldValues) : null,
        params.newValues ? JSON.stringify(params.newValues) : null,
        params.reason || null,
        ipAddress,
        userAgent,
      ]
    )
  } catch (error) {
    console.error('Error creating audit log:', error)
    // Don't throw - audit logging should not break the main flow
  }
}

