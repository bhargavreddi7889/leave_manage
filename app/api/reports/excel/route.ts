import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { queryMany } from '@/lib/db'
import * as XLSX from 'xlsx'

// Generate Excel report for leave requests
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

    // Employees can only download their own reports
    const targetUserId = session.user.role === 'EMPLOYEE' ? session.user.id : (userId || session.user.id)

    let sql = `SELECT 
      lr.id,
      u.first_name || ' ' || u.last_name as employee_name,
      u.employee_id,
      u.email,
      u.department,
      u.position,
      lt.name as leave_type,
      lr.start_date,
      lr.end_date,
      lr.days,
      lr.reason,
      lr.status,
      lr.approved_at,
      CASE 
        WHEN lr.approved_by_id IS NOT NULL THEN approver.first_name || ' ' || approver.last_name
        ELSE NULL
      END as approved_by,
      lr.rejection_reason,
      lr.created_at
      FROM leave_requests lr
      JOIN users u ON lr.user_id = u.id
      JOIN leave_types lt ON lr.leave_type_id = lt.id
      LEFT JOIN users approver ON lr.approved_by_id = approver.id
      WHERE lr.user_id = $1`
    
    const params: any[] = [targetUserId]
    let paramCount = 2

    if (startDate) {
      sql += ` AND lr.start_date >= $${paramCount++}`
      params.push(startDate)
    }

    if (endDate) {
      sql += ` AND lr.end_date <= $${paramCount++}`
      params.push(endDate)
    }

    sql += ' ORDER BY lr.created_at DESC'

    const rows = await queryMany(sql, params)

    // Format data for Excel
    const excelData = rows.map((row: any) => ({
      'Employee ID': row.employee_id,
      'Employee Name': row.employee_name,
      'Email': row.email,
      'Department': row.department || '',
      'Position': row.position || '',
      'Leave Type': row.leave_type,
      'Start Date': new Date(row.start_date).toLocaleDateString(),
      'End Date': new Date(row.end_date).toLocaleDateString(),
      'Days': parseFloat(row.days || '0'),
      'Status': row.status,
      'Reason': row.reason || '',
      'Approved By': row.approved_by || '',
      'Approved At': row.approved_at ? new Date(row.approved_at).toLocaleDateString() : '',
      'Rejection Reason': row.rejection_reason || '',
      'Created At': new Date(row.created_at).toLocaleDateString(),
    }))

    // Create workbook
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(excelData)
    
    // Set column widths
    const colWidths = [
      { wch: 12 }, // Employee ID
      { wch: 20 }, // Employee Name
      { wch: 25 }, // Email
      { wch: 15 }, // Department
      { wch: 15 }, // Position
      { wch: 15 }, // Leave Type
      { wch: 12 }, // Start Date
      { wch: 12 }, // End Date
      { wch: 8 },  // Days
      { wch: 12 }, // Status
      { wch: 30 }, // Reason
      { wch: 20 }, // Approved By
      { wch: 15 }, // Approved At
      { wch: 30 }, // Rejection Reason
      { wch: 15 }, // Created At
    ]
    worksheet['!cols'] = colWidths

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Leave Report')

    // Generate buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' })

    // Get user info for filename
    const userInfo = rows.length > 0 ? rows[0] : null
    const filename = userInfo 
      ? `Leave_Report_${userInfo.employee_id}_${new Date().toISOString().split('T')[0]}.xlsx`
      : `Leave_Report_${new Date().toISOString().split('T')[0]}.xlsx`

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: any) {
    console.error('Error generating Excel report:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

