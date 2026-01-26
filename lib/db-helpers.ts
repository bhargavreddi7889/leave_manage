import { queryOne, queryMany, query } from './db'
import { User, LeaveType, LeaveRequest, LeaveBalance } from '@/types/database'

// User queries
export async function findUserByEmail(email: string): Promise<User | null> {
  const row = await queryOne('SELECT * FROM users WHERE email = $1', [email])
  if (!row) return null
  return mapUserRow(row)
}

export async function findUserById(id: string): Promise<User | null> {
  const row = await queryOne('SELECT * FROM users WHERE id = $1', [id])
  if (!row) return null
  return mapUserRow(row)
}

function mapUserRow(row: any): User {
  return {
    id: row.id,
    email: row.email,
    password: row.password,
    firstName: row.first_name,
    lastName: row.last_name,
    employeeId: row.employee_id,
    phone: row.phone,
    department: row.department,
    position: row.position,
    managerId: row.manager_id,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function countUsers(): Promise<number> {
  const result = await queryOne('SELECT COUNT(*) as count FROM users', [])
  return parseInt(result?.count || '0')
}

export async function findUsers(where?: { managerId?: string; role?: string; isActive?: boolean }): Promise<User[]> {
  let sql = 'SELECT * FROM users WHERE 1=1'
  const params: any[] = []
  let paramCount = 1

  if (where?.managerId) {
    sql += ` AND manager_id = $${paramCount++}`
    params.push(where.managerId)
  }
  if (where?.role) {
    sql += ` AND role = $${paramCount++}`
    params.push(where.role)
  }
  if (where?.isActive !== undefined) {
    sql += ` AND is_active = $${paramCount++}`
    params.push(where.isActive)
  }

  sql += ' ORDER BY first_name ASC'
  const rows = await queryMany(sql, params)
  return rows.map(mapUserRow)
}

// Leave Type queries
export async function findLeaveTypeById(id: string): Promise<LeaveType | null> {
  const row = await queryOne('SELECT * FROM leave_types WHERE id = $1', [id])
  if (!row) return null
  return {
    id: row.id,
    name: row.name,
    type: row.type,
    maxDays: row.max_days,
    carryForward: row.carry_forward,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function findActiveLeaveTypes(): Promise<LeaveType[]> {
  const rows = await queryMany('SELECT * FROM leave_types WHERE is_active = true ORDER BY name')
  return rows.map((row: any) => ({
    id: row.id,
    name: row.name,
    type: row.type,
    maxDays: row.max_days,
    carryForward: row.carry_forward,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }))
}

// Leave Request queries
export async function findLeaveRequests(where?: { userId?: string; status?: string; managerId?: string }): Promise<any[]> {
  let sql = `SELECT lr.*, 
    u.id as user_id, u.first_name as user_first_name, u.last_name as user_last_name, u.employee_id as user_employee_id, u.email as user_email,
    lt.id as leave_type_id, lt.name as leave_type_name, lt.type as leave_type_type
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.id
    JOIN leave_types lt ON lr.leave_type_id = lt.id
    WHERE 1=1`
  const params: any[] = []
  let paramCount = 1

  if (where?.userId) {
    sql += ` AND lr.user_id = $${paramCount++}`
    params.push(where.userId)
  }
  if (where?.status) {
    sql += ` AND lr.status = $${paramCount++}`
    params.push(where.status)
  }
  if (where?.managerId) {
    sql += ` AND u.manager_id = $${paramCount++}`
    params.push(where.managerId)
  }

  sql += ' ORDER BY lr.created_at DESC'
  const rows = await queryMany(sql, params)
  
  return rows.map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    leaveTypeId: row.leave_type_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    days: parseFloat(row.days),
    reason: row.reason,
    attachment: row.attachment,
    status: row.status,
    approvedById: row.approved_by_id,
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    rejectionReason: row.rejection_reason,
    comments: row.comments,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    user: {
      id: row.user_id,
      firstName: row.user_first_name,
      lastName: row.user_last_name,
      employeeId: row.user_employee_id,
      email: row.user_email,
    },
    leaveType: {
      id: row.leave_type_id,
      name: row.leave_type_name,
      type: row.leave_type_type,
    },
  }))
}

export async function findLeaveRequestById(id: string): Promise<any | null> {
  const row = await queryOne(
    `SELECT lr.*, 
     lt.id as leave_type_id, lt.name as leave_type_name
     FROM leave_requests lr
     JOIN leave_types lt ON lr.leave_type_id = lt.id
     WHERE lr.id = $1`,
    [id]
  )
  
  if (!row) return null
  
  return {
    id: row.id,
    userId: row.user_id,
    leaveTypeId: row.leave_type_id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    days: parseFloat(row.days),
    reason: row.reason,
    attachment: row.attachment,
    status: row.status,
    approvedById: row.approved_by_id,
    approvedAt: row.approved_at ? new Date(row.approved_at) : null,
    rejectionReason: row.rejection_reason,
    comments: row.comments,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    leaveType: {
      id: row.leave_type_id,
      name: row.leave_type_name,
    },
  }
}

export async function countLeaveRequests(where?: { userId?: string; status?: string; managerId?: string }): Promise<number> {
  let sql = 'SELECT COUNT(*) as count FROM leave_requests lr'
  const params: any[] = []
  let paramCount = 1
  let hasJoin = false

  if (where?.managerId) {
    sql += ' JOIN users u ON lr.user_id = u.id'
    hasJoin = true
    sql += ` WHERE u.manager_id = $${paramCount++}`
    params.push(where.managerId)
  } else {
    sql += ' WHERE 1=1'
  }

  if (where?.userId) {
    sql += ` AND lr.user_id = $${paramCount++}`
    params.push(where.userId)
  }
  if (where?.status) {
    sql += ` AND lr.status = $${paramCount++}`
    params.push(where.status)
  }

  const result = await queryOne(sql, params)
  return parseInt(result?.count || '0')
}

// Leave Balance queries
export async function findLeaveBalance(userId: string, leaveTypeId: string, year: number): Promise<LeaveBalance | null> {
  const row = await queryOne(
    `SELECT * FROM leave_balances 
     WHERE user_id = $1 AND leave_type_id = $2 AND year = $3`,
    [userId, leaveTypeId, year]
  )
  if (!row) return null
  return {
    id: row.id,
    userId: row.user_id,
    leaveTypeId: row.leave_type_id,
    balance: parseFloat(row.balance),
    year: row.year,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

