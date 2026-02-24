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
    const format     = searchParams.get('format') || 'excel'
    const startDate  = searchParams.get('startDate')
    const endDate    = searchParams.get('endDate')
    const department = searchParams.get('department')

    let sql = `SELECT lr.*,
      u.first_name as user_first_name, u.last_name as user_last_name, u.employee_id as user_employee_id,
      u.email as user_email, u.department as user_department,
      lt.name as leave_type_name
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      WHERE 1=1`
    const params: any[] = []
    let paramCount = 1

    if (session.user.role === 'EMPLOYEE') {
      sql += ` AND lr.user_id = $${paramCount++}`
      params.push(session.user.id)
    } else if (session.user.role === 'HOD') {
      sql += ` AND u.hod_id = $${paramCount++}`
      params.push(session.user.id)
    } else if (session.user.role === 'ADMIN' && department) {
      sql += ` AND u.department = $${paramCount++}`
      params.push(department)
    }

    if (startDate) {
      sql += ` AND lr.start_date >= $${paramCount++}`
      params.push(new Date(startDate))
    }
    if (endDate) {
      sql += ` AND lr.end_date <= $${paramCount++}`
      params.push(new Date(endDate))
    }

    sql += ` ORDER BY u.department, u.first_name, lr.created_at DESC`

    const rows = await queryMany(sql, params)
    
    const leaves = rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      leaveTypeId: row.leave_type_id,
      startDate: new Date(row.start_date),
      endDate: new Date(row.end_date),
      days: parseFloat(row.days),
      reason: row.reason,
      status: row.status,
      approvedAt: row.approved_at ? new Date(row.approved_at) : null,
      createdAt: new Date(row.created_at),
      user: {
        firstName: row.user_first_name,
        lastName: row.user_last_name,
        employeeId: row.user_employee_id,
        email: row.user_email,
        department: row.user_department,
      },
      leaveType: {
        name: row.leave_type_name,
      },
    }))

    if (format === 'excel') {
      const data = leaves.map((leave) => ({
        'Employee ID': leave.user.employeeId,
        'Employee Name': `${leave.user.firstName} ${leave.user.lastName}`,
        'Email': leave.user.email,
        'Department': leave.user.department || '-',
        'Leave Type': leave.leaveType.name,
        'Start Date': formatDate(leave.startDate),
        'End Date': formatDate(leave.endDate),
        'Days': leave.days,
        'Status': leave.status,
        'Reason': leave.reason || '-',
        'Applied On': formatDate(leave.createdAt),
        'Approved On': leave.approvedAt ? formatDate(leave.approvedAt) : '-',
      }))

      const worksheet = XLSX.utils.json_to_sheet(data)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Report')
      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="leave-report-${new Date().toISOString().split('T')[0]}.xlsx"`,
        },
      })
    }

    return NextResponse.json(leaves)
  } catch (error: any) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

