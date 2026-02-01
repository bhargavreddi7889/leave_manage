import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { queryOne } from '@/lib/db'

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

    // Employees can only view their own summary
    if (session.user.role === 'EMPLOYEE' && userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // HOD can view team members
    if (session.user.role === 'HOD' && userId !== session.user.id) {
      const userCheck = await queryOne(
        `SELECT hod_id FROM users WHERE id = $1`,
        [userId]
      )
      if (userCheck?.hod_id !== session.user.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
      }
    }

    let sql = `
      SELECT 
        COUNT(*) FILTER (WHERE a.status = 'PRESENT') as present_days,
        COUNT(*) FILTER (WHERE a.status = 'ABSENT') as absent_days,
        COUNT(*) FILTER (WHERE a.status = 'HALF_DAY') as half_days,
        COUNT(*) FILTER (WHERE a.status = 'ON_LEAVE') as leave_days,
        COUNT(*) as total_days
      FROM attendance a
      WHERE a.user_id = $1
    `
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

    const result = await queryOne(sql, params)

    const totalDays = parseInt(result?.total_days || '0')
    const presentDays = parseInt(result?.present_days || '0')
    const absentDays = parseInt(result?.absent_days || '0')
    const halfDays = parseInt(result?.half_days || '0')
    const leaveDays = parseInt(result?.leave_days || '0')

    // Calculate attendance rate (Present + Half Day / Total)
    const attendanceRate = totalDays > 0 
      ? ((presentDays + halfDays) / totalDays) * 100 
      : 0

    return NextResponse.json({
      totalDays,
      presentDays,
      absentDays,
      halfDays,
      leaveDays,
      attendanceRate,
    })
  } catch (error: any) {
    console.error('Error fetching attendance summary:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

