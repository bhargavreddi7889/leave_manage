import { compare, hash } from 'bcryptjs'
import { queryOne, query } from './db'
import { User, UserRole } from '@/types/database'

export async function hashPassword(password: string): Promise<string> {
  return hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return compare(password, hashedPassword)
}

export async function getUserByEmail(email: string): Promise<(User & { hod?: { id: string; firstName: string; lastName: string; email: string } | null }) | null> {
  const user = await queryOne(
    `SELECT u.*, 
     h.id as hod_id, h.first_name as hod_first_name, h.last_name as hod_last_name, h.email as hod_email
     FROM users u
     LEFT JOIN users h ON u.hod_id = h.id
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
    hodId: user.hod_id,
    role: user.role,
    isActive: user.is_active,
    createdAt: user.created_at,
    updatedAt: user.updated_at,
    hod: user.hod_id ? {
      id: user.hod_id,
      firstName: user.hod_first_name,
      lastName: user.hod_last_name,
      email: user.hod_email,
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
  hodId?: string
}): Promise<User> {
  const hashedPassword = await hashPassword(data.password)
  
  const result = await query(
    `INSERT INTO users (email, password, first_name, last_name, employee_id, role, phone, department, position, hod_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
     RETURNING *`,
    [data.email, hashedPassword, data.firstName, data.lastName, data.employeeId, data.role, data.phone || null, data.department || null, data.position || null, data.hodId || null]
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
    hodId: row.hod_id,
    role: row.role,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

