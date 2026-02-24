import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { queryMany } from '@/lib/db'
import * as XLSX from 'xlsx'
import { formatDate } from '@/lib/utils'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const userId    = searchParams.get('userId')
    const department = searchParams.get('department') // admin-only filter
    const startDate = searchParams.get('startDate')
    const endDate   = searchParams.get('endDate')

    // --- Authorization ---
    if (session.user.role === 'EMPLOYEE') {
      // Employees can only download their own report
      if (userId && userId !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    if (session.user.role === 'HOD' && userId && userId !== session.user.id) {
      const userCheck = await queryMany(
        `SELECT hod_id FROM users WHERE id = $1`,
        [userId]
      )
      if (userCheck[0]?.hod_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    // Department filter is admin-only
    if (department && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // --- Build query ---
    const params: any[] = []
    let paramCount = 1
    let whereClause = `u.is_active = true`

    if (session.user.role === 'EMPLOYEE') {
      whereClause += ` AND a.user_id = $${paramCount++}`
      params.push(session.user.id)
    } else if (session.user.role === 'HOD' && userId) {
      whereClause += ` AND a.user_id = $${paramCount++}`
      params.push(userId)
    } else if (session.user.role === 'HOD') {
      whereClause += ` AND a.user_id = $${paramCount++}`
      params.push(session.user.id)
    } else if (session.user.role === 'ADMIN') {
      if (department) {
        whereClause += ` AND u.department = $${paramCount++}`
        params.push(department)
      } else if (userId) {
        whereClause += ` AND a.user_id = $${paramCount++}`
        params.push(userId)
      }
      // If neither, download for ALL users (full org report)
    }

    if (startDate) {
      whereClause += ` AND a.date >= $${paramCount++}`
      params.push(startDate)
    }
    if (endDate) {
      whereClause += ` AND a.date <= $${paramCount++}`
      params.push(endDate)
    }

    const sql = `
      SELECT a.*,
        u.first_name, u.last_name, u.employee_id, u.email, u.department, u.position
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE ${whereClause}
      ORDER BY u.department, u.first_name, a.date DESC`

    const rows = await queryMany(sql, params)

    const excelData = rows.map((row: any) => {
      const checkIn  = row.check_in  ? new Date(row.check_in)  : null
      const checkOut = row.check_out ? new Date(row.check_out) : null
      const wh = row.working_hours ? parseFloat(row.working_hours).toFixed(2) : ''

      return {
        'Date':          formatDate(new Date(row.date)),
        'Employee ID':   row.employee_id,
        'Employee Name': `${row.first_name} ${row.last_name}`,
        'Department':    row.department || '-',
        'Position':      row.position   || '-',
        'Check In':      checkIn  ? checkIn.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
        'Check Out':     checkOut ? checkOut.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
        'Working Hours': wh ? `${wh} hrs` : '-',
        'Status':        (row.status || '-').replace(/_/g, ' '),
        'Remarks':       row.remarks   || '-',
        'Marked By':     row.marked_by || 'USER',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // Auto-fit column widths
    const colWidths = Object.keys(excelData[0] || {}).map((key) => ({
      wch: Math.max(key.length, 14),
    }))
    worksheet['!cols'] = colWidths

    const workbook = XLSX.utils.book_new()
    const sheetName = department ? `${department} Attendance` : 'Attendance Report'
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31))
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const suffix = department ? `_${department}` : ''
    const filename = `Attendance_Report${suffix}_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating attendance report:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
