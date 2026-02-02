import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

/**
 * API endpoint to verify OTP and allow password reset
 * Public endpoint (no authentication required)
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { mobile, otp } = body

    if (!mobile || !otp) {
      return NextResponse.json(
        { error: 'Mobile number and OTP are required' },
        { status: 400 }
      )
    }

    // Find valid OTP
    const otpRecord = await queryOne(
      `SELECT * FROM password_reset_otps 
       WHERE mobile = $1 AND otp = $2 AND is_used = false 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [mobile, otp]
    )

    if (!otpRecord) {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      )
    }

    // Check if OTP is expired
    const now = new Date()
    const expiresAt = new Date(otpRecord.expires_at)

    if (now > expiresAt) {
      return NextResponse.json(
        { error: 'OTP has expired. Please request a new one.' },
        { status: 400 }
      )
    }

    // Mark OTP as used
    await query(
      'UPDATE password_reset_otps SET is_used = true WHERE id = $1',
      [otpRecord.id]
    )

    // Get user details
    const user = await queryOne(
      'SELECT id, first_name, last_name, employee_id FROM users WHERE id = $1',
      [otpRecord.user_id]
    )

    return NextResponse.json({
      success: true,
      userId: user.id,
      user: {
        firstName: user.first_name,
        lastName: user.last_name,
        employeeId: user.employee_id,
      },
      message: 'OTP verified successfully. You can now reset your password.',
    })
  } catch (error: any) {
    console.error('Error verifying OTP:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

