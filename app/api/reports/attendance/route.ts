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
    const userId = searchParams.get('userId') || session.user.id
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Employees can only download their own reports
    if (session.user.role === 'EMPLOYEE' && userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // HOD can download team member reports
    if (session.user.role === 'HOD' && userId !== session.user.id) {
      const userCheck = await queryMany(
        `SELECT hod_id FROM users WHERE id = $1`,
        [userId]
      )
      if (userCheck[0]?.hod_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    let sql = `SELECT a.*, 
      u.first_name, u.last_name, u.employee_id, u.email, u.department, u.position
      FROM attendance a
      JOIN users u ON a.user_id = u.id
      WHERE a.user_id = $1 AND u.is_active = true`
    const params: any[] = [userId]
    let paramCount = 2

    if (startDate) {
      sql += ` AND a.date >= $${paramCount++}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND a.date <= $${paramCount++}`
      params.push(endDate)
    }

    sql += ' ORDER BY a.date DESC'

    const rows = await queryMany(sql, params)

    const excelData = rows.map((row: any) => {
      const checkIn = row.check_in ? new Date(row.check_in) : null
      const checkOut = row.check_out ? new Date(row.check_out) : null
      const workingHours = row.working_hours ? parseFloat(row.working_hours).toFixed(2) : ''
      
      return {
        'Date': formatDate(new Date(row.date)),
        'Employee ID': row.employee_id,
        'Employee Name': `${row.first_name} ${row.last_name}`,
        'Email': row.email,
        'Department': row.department || '-',
        'Position': row.position || '-',
        'Check In': checkIn ? checkIn.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
        'Check Out': checkOut ? checkOut.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }) : '-',
        'Working Hours': workingHours ? `${workingHours} hrs` : '-',
        'Status': row.status.replace(/_/g, ' '),
        'Late Entry': row.is_late_entry ? 'Yes' : 'No',
        'Early Exit': row.is_early_exit ? 'Yes' : 'No',
        'Remarks': row.remarks || '-',
        'Marked By': row.marked_by || 'USER',
      }
    })

    const worksheet = XLSX.utils.json_to_sheet(excelData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report')
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    const filename = `Attendance_Report_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating attendance report:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

