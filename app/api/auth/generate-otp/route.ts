import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryOne } from '@/lib/db'

/**
 * API endpoint for admin to generate OTP for password reset
 * Only accessible by ADMIN users
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    // Only admin can generate OTP
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Unauthorized. Only admins can generate OTP.' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { mobile } = body

    if (!mobile) {
      return NextResponse.json(
        { error: 'Mobile number is required' },
        { status: 400 }
      )
    }

    // Check if user exists with this mobile number
    const user = await queryOne(
      'SELECT id, first_name, last_name, employee_id, is_active FROM users WHERE mobile = $1',
      [mobile]
    )

    if (!user) {
      return NextResponse.json(
        { error: 'No user found with this mobile number' },
        { status: 404 }
      )
    }

    if (!user.is_active) {
      return NextResponse.json(
        { error: 'User account is inactive' },
        { status: 400 }
      )
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString()

    // Set expiry to 10 minutes from now
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 10)

    // Invalidate any existing OTPs for this user
    await query(
      'UPDATE password_reset_otps SET is_used = true WHERE user_id = $1 AND is_used = false',
      [user.id]
    )

    // Store OTP in database
    await query(
      `INSERT INTO password_reset_otps (mobile, user_id, otp, expires_at, created_by)
       VALUES ($1, $2, $3, $4, $5)`,
      [mobile, user.id, otp, expiresAt, session.user.id]
    )

    return NextResponse.json({
      success: true,
      otp,
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        employeeId: user.employee_id,
      },
      expiresAt,
      message: 'OTP generated successfully. Valid for 10 minutes.',
    })
  } catch (error: any) {
    console.error('Error generating OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

