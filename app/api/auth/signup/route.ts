import { NextRequest, NextResponse } from 'next/server'
import { createUser } from '@/lib/auth'
import { findUserByEmail, countUsers } from '@/lib/db-helpers'

/**
 * SECURITY: Public signup is disabled
 * Only admins can create employee accounts via the admin panel
 */
export async function POST(req: NextRequest) {
  console.warn('Attempted access to disabled signup endpoint from:', req.headers.get('x-forwarded-for') || 'unknown')
  
  return NextResponse.json(
    { 
      error: 'Registration is disabled. Please contact your administrator to create an account.',
      code: 'SIGNUP_DISABLED'
    },
    { status: 403 }
  )
}

