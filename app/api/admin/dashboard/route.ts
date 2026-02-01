import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { queryOne, queryMany } from '@/lib/db'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Today at a Glance
    const todayStats = await queryOne(
      `SELECT 
        COUNT(*) FILTER (WHERE a.status = 'PRESENT') as present_count,
        COUNT(*) FILTER (WHERE a.status = 'ABSENT') as absent_count,
        COUNT(*) FILTER (WHERE a.status = 'ON_LEAVE') as on_leave_count,
        COUNT(*) FILTER (WHERE COALESCE(a.is_late_entry, false) = true) as late_checkins,
        COUNT(*) FILTER (WHERE a.check_in IS NOT NULL AND a.check_out IS NULL AND a.status != 'ON_LEAVE') as missed_checkouts
      FROM attendance a
      WHERE a.date = $1`,
      [today]
    )

    // 2. Needs Attention / Alerts
    const pendingLeavesResult = await queryOne(
      `SELECT COUNT(*) as count FROM leave_requests WHERE status = 'PENDING'`
    )
    const pendingCount = parseInt(pendingLeavesResult?.count || '0')

    // Check for attendance conflicts (user checked in but has approved leave)
    const attendanceConflictsResult = await queryOne(
      `SELECT COUNT(*) as count
       FROM attendance a
       JOIN leave_requests lr ON a.user_id = lr.user_id
       WHERE a.date = $1
       AND a.check_in IS NOT NULL
       AND lr.status = 'APPROVED'
       AND lr.start_date <= $1
       AND lr.end_date >= $1`,
      [today]
    )
    const conflictsCount = parseInt(attendanceConflictsResult?.count || '0')

    // 3. Leave Snapshot (Current Month)
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
    const leaveSnapshot = await queryOne(
      `SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COUNT(*) FILTER (WHERE status = 'APPROVED') as approved,
        COUNT(*) FILTER (WHERE status = 'REJECTED') as rejected
      FROM leave_requests
      WHERE created_at >= $1`,
      [currentMonthStart]
    )

    // 4. Recent Activity (Last 10 leave requests)
    const recentLeaves = await queryMany(
      `SELECT lr.*, 
       u.first_name, u.last_name, u.employee_id,
       lt.name as leave_type_name
       FROM leave_requests lr
       JOIN users u ON lr.user_id = u.id
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       ORDER BY lr.created_at DESC
       LIMIT 10`
    )

    // 5. Admin's Personal Attendance Today
    const adminAttendance = await queryOne(
      `SELECT * FROM attendance 
       WHERE user_id = $1 AND date = $2`,
      [session.user.id, today]
    )

    return NextResponse.json({
      todayAtGlance: {
        presentToday: parseInt(todayStats?.present_count || '0'),
        absentToday: parseInt(todayStats?.absent_count || '0'),
        onLeaveToday: parseInt(todayStats?.on_leave_count || '0'),
        lateCheckIns: parseInt(todayStats?.late_checkins || '0'),
        missedCheckOuts: parseInt(todayStats?.missed_checkouts || '0'),
      },
      needsAttention: {
        pendingLeaveApprovals: pendingCount,
        missedCheckOuts: parseInt(todayStats?.missed_checkouts || '0'),
        attendanceConflicts: conflictsCount,
      },
      leaveSnapshot: {
        total: parseInt(leaveSnapshot?.total || '0'),
        pending: parseInt(leaveSnapshot?.pending || '0'),
        approved: parseInt(leaveSnapshot?.approved || '0'),
        rejected: parseInt(leaveSnapshot?.rejected || '0'),
      },
      recentActivity: recentLeaves.map((leave: any) => ({
        id: leave.id,
        type: 'leave',
        user: `${leave.first_name} ${leave.last_name}`,
        employeeId: leave.employee_id,
        leaveType: leave.leave_type_name,
        status: leave.status,
        createdAt: leave.created_at,
        startDate: leave.start_date,
        endDate: leave.end_date,
      })),
      adminAttendance: adminAttendance ? {
        checkIn: adminAttendance.check_in,
        checkOut: adminAttendance.check_out,
        workingHours: adminAttendance.working_hours || null,
        isLateEntry: adminAttendance.is_late_entry || false,
        isEarlyExit: adminAttendance.is_early_exit || false,
        status: adminAttendance.status,
      } : null,
    })
  } catch (error: any) {
    console.error('Error fetching admin dashboard data:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

