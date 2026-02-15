import { NextRequest, NextResponse } from 'next/server'
import { calculateEarnLeaveForAllUsers } from '@/lib/leave-calculations'

/**
 * POST - Calculate and update Earn Leave balances for all employees
 * This endpoint should be called by a cron job periodically (e.g., monthly)
 * 
 * SECURITY: Protected by CRON_SECRET environment variable
 * Only requests with valid Bearer token matching CRON_SECRET are allowed
 * 
 * Production Security:
 * - Requires CRON_SECRET to be set in environment variables
 * - Validates Bearer token in Authorization header
 * - Logs unauthorized access attempts for security monitoring
 * - Returns generic error messages to prevent information leakage
 * - Validates request body to prevent injection attacks
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require CRON_SECRET to be set
    if (!process.env.CRON_SECRET) {
      console.error('[SECURITY] CRON_SECRET is not configured. Earn Leave calculation endpoint is disabled.')
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503 }
      )
    }

    // SECURITY: Verify authorization header exists
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader) {
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      console.warn(`[SECURITY] Earn Leave calculation endpoint accessed without authorization header from IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Unauthorized: Missing authorization header' },
        { status: 401 }
      )
    }

    // SECURITY: Verify Bearer token matches CRON_SECRET (constant-time comparison)
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`
    
    // Use constant-time comparison to prevent timing attacks
    if (authHeader.length !== expectedToken.length) {
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      console.warn(`[SECURITY] Earn Leave calculation endpoint accessed with invalid authorization token from IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }

    // Constant-time string comparison
    let isValid = true
    for (let i = 0; i < authHeader.length; i++) {
      if (authHeader[i] !== expectedToken[i]) {
        isValid = false
      }
    }

    if (!isValid) {
      const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
      console.warn(`[SECURITY] Earn Leave calculation endpoint accessed with invalid authorization token from IP: ${clientIP}`)
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }

    // SECURITY: Validate and parse request body safely
    let body: { year?: number } = {}
    try {
      const rawBody = await req.json()
      // Validate year if provided
      if (rawBody.year !== undefined) {
        const year = parseInt(String(rawBody.year), 10)
        if (isNaN(year) || year < 2000 || year > 2100) {
          return NextResponse.json(
            { error: 'Invalid year parameter' },
            { status: 400 }
          )
        }
        body.year = year
      }
    } catch (parseError) {
      // If body parsing fails, use default year (not an error for cron jobs)
      body = {}
    }

    const year = body.year || new Date().getFullYear()

    // SECURITY: Log successful authentication (without sensitive data)
    console.log(`[AUTH] Earn Leave calculation authenticated successfully for year ${year}`)

    // Execute the calculation
    const result = await calculateEarnLeaveForAllUsers(year)

    // Return success response (without sensitive internal details)
    return NextResponse.json({
      success: true,
      message: `Earn Leave balances calculated successfully`,
      year,
      processed: result.processed,
      updated: result.results.length,
      summary: {
        totalDutyDays: result.results.reduce((sum, r) => sum + r.dutyDays, 0),
        totalEarnedLeave: result.results.reduce((sum, r) => sum + r.earnedLeave, 0),
        totalBalance: result.results.reduce((sum, r) => sum + r.totalBalance, 0),
      },
    })
  } catch (error: any) {
    // SECURITY: Log errors but don't expose internal details
    console.error('[ERROR] Error calculating Earn Leave:', error.message)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET - Health check endpoint (optional, for monitoring)
 * Returns 405 Method Not Allowed to prevent information disclosure
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}

