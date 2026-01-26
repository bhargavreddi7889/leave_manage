export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type LeaveCategory = 'SICK' | 'VACATION' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'BEREAVEMENT' | 'UNPAID'

export interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  employeeId: string
  phone: string | null
  department: string | null
  position: string | null
  managerId: string | null
  role: UserRole
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LeaveType {
  id: string
  name: string
  type: LeaveCategory
  maxDays: number
  carryForward: boolean
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface LeaveBalance {
  id: string
  userId: string
  leaveTypeId: string
  balance: number
  year: number
  createdAt: Date
  updatedAt: Date
}

export interface LeaveRequest {
  id: string
  userId: string
  leaveTypeId: string
  startDate: Date
  endDate: Date
  days: number
  reason: string | null
  attachment: string | null
  status: LeaveStatus
  approvedById: string | null
  approvedAt: Date | null
  rejectionReason: string | null
  comments: string | null
  createdAt: Date
  updatedAt: Date
}

export interface LeavePolicy {
  id: string
  name: string
  description: string | null
  maxDaysPerYear: number
  minDaysNotice: number
  maxConsecutiveDays: number | null
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

