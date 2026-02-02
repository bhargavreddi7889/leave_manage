export type UserRole = 'EMPLOYEE' | 'HOD' | 'ADMIN'
export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED'
export type LeaveCategory = 'EARN_LEAVE' | 'CASUAL' | 'SICK' | 'UNPAID' | 'LEAVE_IN_LIEU' | 'VACATION' | 'PERSONAL' | 'MATERNITY' | 'PATERNITY' | 'BEREAVEMENT'

export interface User {
  id: string
  email: string
  password: string
  firstName: string
  lastName: string
  employeeId: string
  mobile: string | null
  phone: string | null
  department: string | null
  position: string | null
  hodId: string | null
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

export interface LeaveType {
  id: string
  name: string
  type: LeaveCategory
  maxDays: number
  carryForward: boolean
  isActive: boolean
  earningRate?: number | null
  workingDaysRequired?: number | null
  createdAt: Date
  updatedAt: Date
}

export interface Attendance {
  id: string
  userId: string
  date: Date
  checkIn: Date | null
  checkOut: Date | null
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE'
  remarks: string | null
  createdAt: Date
  updatedAt: Date
}

