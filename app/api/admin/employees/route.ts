import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createUser } from '@/lib/auth'
import { initializeLeaveBalances } from '@/lib/leave-calculations'
import { createAuditLog } from '@/lib/audit-log'
import { queryOne } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { email, mobile, firstName, lastName, employeeId, phone, department, position, hodId, role } = body

    if (!mobile || !firstName || !lastName || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields: mobile, firstName, lastName, employeeId' },
        { status: 400 }
      )
    }

    // Generate a temporary random password (user will reset via forgot password)
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase() + '!@' + Date.now()

    // Check if mobile already exists
    const existingMobile = await queryOne(
      'SELECT id FROM users WHERE mobile = $1',
      [mobile]
    )

    if (existingMobile) {
      return NextResponse.json(
        { error: 'Mobile number already exists' },
        { status: 400 }
      )
    }

    const user = await createUser({
      email: email || null,
      mobile,
      password: tempPassword,
      firstName,
      lastName,
      employeeId,
      phone,
      department,
      position,
      hodId: hodId || null,
      role: role || 'EMPLOYEE',
    })

    // Initialize leave balances for new user
    const currentYear = new Date().getFullYear()
    await initializeLeaveBalances(user.id, currentYear)

    // Create audit log
    await createAuditLog({
      actionType: 'EMPLOYEE_CREATE',
      entityType: 'EMPLOYEE',
      entityId: user.id,
      userId: session.user.id,
      oldValues: undefined,
      newValues: {
        email: email || null,
        mobile,
        firstName,
        lastName,
        employeeId,
        role: role || 'EMPLOYEE',
        department,
        position,
        hodId: hodId || null,
      },
      reason: 'New employee created. User will set password via forgot password flow.',
      req,
    })

    return NextResponse.json({
      success: true,
      user,
      message: 'Employee created successfully. User can set password via "Forgot Password".',
    }, { status: 201 })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    if (error.code === '23505') { // PostgreSQL unique violation
      return NextResponse.json(
        { error: 'Email, Mobile number, or Employee ID already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

