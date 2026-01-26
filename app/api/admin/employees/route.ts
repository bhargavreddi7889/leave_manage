import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { createUser } from '@/lib/auth'
import { initializeLeaveBalances } from '@/lib/leave-calculations'

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
    const { email, password, firstName, lastName, employeeId, phone, department, position, managerId, role } = body

    if (!email || !password || !firstName || !lastName || !employeeId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      employeeId,
      phone,
      department,
      position,
      managerId: managerId || null,
      role: role || 'EMPLOYEE',
    })

    // Initialize leave balances for new user
    const currentYear = new Date().getFullYear()
    await initializeLeaveBalances(user.id, currentYear)

    return NextResponse.json(user, { status: 201 })
  } catch (error: any) {
    console.error('Error creating employee:', error)
    if (error.code === '23505') { // PostgreSQL unique violation
      return NextResponse.json(
        { error: 'Email or Employee ID already exists' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

