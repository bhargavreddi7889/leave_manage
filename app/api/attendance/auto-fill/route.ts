import { NextRequest, NextResponse } from 'next/server'
import { query, queryMany } from '@/lib/db'

/**
 * API endpoint to auto-fill attendance for approved leaves
 * This should be called by a cron job daily
 * 
 * SECURITY: Protected by CRON_SECRET environment variable
 * Only requests with valid Bearer token matching CRON_SECRET are allowed
 */
export async function POST(req: NextRequest) {
  try {
    // SECURITY: Require CRON_SECRET to be set
    if (!process.env.CRON_SECRET) {
      console.error('CRON_SECRET is not configured. Auto-fill endpoint is disabled.')
      return NextResponse.json(
        { error: 'Service not configured' },
        { status: 503 }
      )
    }

    // SECURITY: Verify authorization header
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader) {
      console.warn('Auto-fill endpoint accessed without authorization header')
      return NextResponse.json(
        { error: 'Unauthorized: Missing authorization header' },
        { status: 401 }
      )
    }

    // SECURITY: Verify Bearer token matches CRON_SECRET
    const expectedToken = `Bearer ${process.env.CRON_SECRET}`
    if (authHeader !== expectedToken) {
      console.warn('Auto-fill endpoint accessed with invalid authorization token')
      return NextResponse.json(
        { error: 'Unauthorized: Invalid token' },
        { status: 401 }
      )
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Get all approved leave requests that include today
    const approvedLeaves = await queryMany(
      `SELECT lr.*, u.id as user_id, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.status = 'APPROVED'
       AND lr.start_date <= $1
       AND lr.end_date >= $1`,
      [today]
    )

    let created = 0
    let updated = 0

    for (const leave of approvedLeaves) {
      // Check if attendance already exists
      const existing = await query(
        `SELECT id, status FROM attendance WHERE user_id = $1 AND date = $2`,
        [leave.user_id, today]
      )

      if (existing.rows.length > 0) {
        const existingAttendance = existing.rows[0]
        // Update existing attendance to ON_LEAVE if:
        // 1. Status is not already ON_LEAVE
        // 2. It was marked by USER (not SYSTEM or ADMIN/HOD override)
        if (existingAttendance.status !== 'ON_LEAVE' && 
            (existingAttendance.marked_by === 'USER' || existingAttendance.marked_by === null)) {
          await query(
            `UPDATE attendance 
             SET status = 'ON_LEAVE', marked_by = 'SYSTEM', 
             remarks = COALESCE(remarks || '; ', '') || $1, updated_at = NOW()
             WHERE user_id = $2 AND date = $3`,
            [`Auto-updated: ${leave.leave_type_name} leave approved`, leave.user_id, today]
          )
          updated++
        }
      } else {
        // Create new attendance record for leave
        await query(
          `INSERT INTO attendance (user_id, date, status, marked_by, remarks)
           VALUES ($1, $2, 'ON_LEAVE', 'SYSTEM', $3)`,
          [leave.user_id, today, `Auto-filled from ${leave.leave_type_name} leave`]
        )
        created++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Auto-filled attendance for ${approvedLeaves.length} approved leaves`,
      created,
      updated,
    })
  } catch (error: any) {
    console.error('Error auto-filling attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

