import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'
import { findUserByEmail, countUsers } from '@/lib/db-helpers'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { firstName, lastName, email, password } = body

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await findUserByEmail(email)

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }

    // Generate employee ID
    const employeeCount = await countUsers()
    const employeeId = `EMP${String(employeeCount + 1).padStart(3, '0')}`

    // Create user
    const user = await createUser({
      email,
      password,
      firstName,
      lastName,
      employeeId,
      role: 'EMPLOYEE',
    })

    return NextResponse.json(
      { 
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          employeeId: user.employeeId,
        }
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error('Error creating user:', error)
    if (error.code === '23505') { // PostgreSQL unique violation
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

