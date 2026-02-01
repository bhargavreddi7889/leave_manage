import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { query, queryMany } from '@/lib/db'

// GET - Fetch attendance records
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('userId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Employees can only view their own attendance
    // Admin/HOD can view all or specific user's attendance
    if (session.user.role === 'EMPLOYEE' && userId && userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    let sql = `SELECT a.*, 
      u.first_name, u.last_name, u.employee_id, u.email, u.department, u.position
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE 1=1`
    const params: any[] = []
    let paramCount = 1

    if (userId) {
      sql += ` AND a.user_id = $${paramCount++}`
      params.push(userId)
    } else if (session.user.role === 'EMPLOYEE') {
      sql += ` AND a.user_id = $${paramCount++}`
      params.push(session.user.id)
    }

    if (startDate) {
      sql += ` AND a.date >= $${paramCount++}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND a.date <= $${paramCount++}`
      params.push(endDate)
    }

    sql += ' ORDER BY a.date DESC, u.first_name ASC'

    const rows = await queryMany(sql, params)

    const attendance = rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      date: row.date,
      checkIn: row.check_in ? new Date(row.check_in) : null,
      checkOut: row.check_out ? new Date(row.check_out) : null,
      status: row.status,
      remarks: row.remarks,
      isLateEntry: row.is_late_entry || false,
      isEarlyExit: row.is_early_exit || false,
      workingHours: row.working_hours ? parseFloat(row.working_hours) : null,
      markedBy: row.marked_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      user: {
        id: row.user_id,
        firstName: row.first_name,
        lastName: row.last_name,
        employeeId: row.employee_id,
        email: row.email,
        department: row.department,
        position: row.position,
      },
    }))

    return NextResponse.json(attendance)
  } catch (error: any) {
    console.error('Error fetching attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST - Create or update attendance (Admin/HOD only)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !['ADMIN', 'HOD'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'Unauthorized - Only Admin/HOD can modify attendance' },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { userId, date, checkIn, checkOut, status, remarks } = body

    if (!userId || !date) {
      return NextResponse.json(
        { error: 'Missing required fields: userId and date' },
        { status: 400 }
      )
    }

    // Check if attendance record already exists
    const existing = await query(
      `SELECT id FROM attendance WHERE user_id = $1 AND date = $2`,
      [userId, date]
    )

    const markedBy = session.user.role === 'ADMIN' ? 'ADMIN' : 'HOD'

    if (existing.rows.length > 0) {
      // Update existing record
      const result = await query(
        `UPDATE attendance 
         SET check_in = $1, check_out = $2, status = $3, remarks = $4, marked_by = $5, updated_at = NOW()
         WHERE user_id = $6 AND date = $7
         RETURNING *`,
        [checkIn || null, checkOut || null, status || 'PRESENT', remarks || null, markedBy, userId, date]
      )

      return NextResponse.json(result.rows[0], { status: 200 })
    } else {
      // Create new record
      const result = await query(
        `INSERT INTO attendance (user_id, date, check_in, check_out, status, remarks, marked_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, date, checkIn || null, checkOut || null, status || 'PRESENT', remarks || null, markedBy]
      )

      return NextResponse.json(result.rows[0], { status: 201 })
    }
  } catch (error: any) {
    console.error('Error creating/updating attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

