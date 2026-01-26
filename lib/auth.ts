import { compare, hash } from 'bcryptjs'
import { queryOne, query } from './db'
import { User, UserRole } from '@/types/database'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function getUserByEmail(email: string): Promise<(User & { manager?: { id: string; firstName: string; lastName: string; email: string } | null }) | null> {
  const user = await queryOne(
    `SELECT u.*, 
     m.id as manager_id, m.first_name as manager_first_name, m.last_name as manager_last_name, m.email as manager_email
     FROM users u
     LEFT JOIN users m ON u.manager_id = m.id
     WHERE u.email = $1`,
    [email]
  )
  
  if (!user) return null
  
  return {
    id: user.id,
    email: user.email,
    password: user.password,
    firstName: user.first_name,
    lastName: user.last_name,
    employeeId: user.employee_id,
    phone: user.phone,
    department: user.department,
    position: user.position,
    managerId: user.manager_id,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    manager: user.manager_id ? {
      id: user.manager_id,
      firstName: user.manager_first_name,
      lastName: user.manager_last_name,
      email: user.manager_email,
    } : null
  } as any
}

export async function createUser(data: {
  email: string
  password: string
  firstName: string
  lastName: string
  employeeId: string
  role: UserRole
  phone?: string
  department?: string
  position?: string
  managerId?: string
}): Promise<User> {
  const hashedPassword = await hashPassword(data.password)
  
  const result = await query(
    `INSERT INTO users (email, password, first_name, last_name, employee_id, role, phone, department, position, manager_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [data.email, hashedPassword, data.firstName, data.lastName, data.employeeId, data.role, data.phone || null, data.department || null, data.position || null, data.managerId || null]
  )
  
  const row = result.rows[0]
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

