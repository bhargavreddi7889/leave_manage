import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { queryOne } from '@/lib/db'
import { getActiveAttendancePolicy } from '@/lib/attendance-policy'
import { isAttendanceEnabled } from '@/lib/attendance-control'

// GET - Get today's attendance status
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if attendance is enabled
    const attendanceEnabled = await isAttendanceEnabled()
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const attendance = await queryOne(
      `SELECT a.*, 
       u.first_name, u.last_name, u.employee_id
       FROM attendance a
       JOIN users u ON a.user_id = u.id
       WHERE a.user_id = $1 AND a.date = $2`,
      [session.user.id, today]
    )

    // Check if user has approved leave for today
    const leaveCheck = await queryOne(
      `SELECT lr.*, lt.name as leave_type_name
       FROM leave_requests lr
       JOIN leave_types lt ON lr.leave_type_id = lt.id
       WHERE lr.user_id = $1
       AND lr.status = 'APPROVED'
       AND lr.start_date <= $2
       AND lr.end_date >= $2`,
      [session.user.id, today]
    )

    if (leaveCheck) {
      return NextResponse.json({
        hasAttendance: true,
        isOnLeave: true,
        leaveType: leaveCheck.leave_type_name,
        status: 'ON_LEAVE',
        checkIn: null,
        checkOut: null,
      })
    }

    // Get policy for late/early indicators and office hours
    let policy = null
    let canCheckIn = !attendance ? true : !attendance.check_in
    let canCheckOut = attendance ? (!!attendance.check_in && !attendance.check_out) : false
    
    try {
      policy = await getActiveAttendancePolicy()
      
      if (policy) {
        // Check if current time is within office hours for check-in
        const now = new Date()
        const [startHours, startMinutes] = policy.officeStartTime.split(':').map(Number)
        const [endHours, endMinutes] = policy.officeEndTime.split(':').map(Number)
        
        const officeStart = new Date(now)
        officeStart.setHours(startHours, startMinutes, 0, 0)
        
        const officeEnd = new Date(now)
        officeEnd.setHours(endHours, endMinutes, 0, 0)
        
        // Allow check-in from 1 hour before office start to 2 hours after office end
        const checkInStart = new Date(officeStart)
        checkInStart.setHours(checkInStart.getHours() - 1)
        
        const checkInEnd = new Date(officeEnd)
        checkInEnd.setHours(checkInEnd.getHours() + 2)
        
        // Only show check-in if within allowed window and not already checked in
        if (canCheckIn) {
          canCheckIn = now >= checkInStart && now <= checkInEnd
        }
        
        // Only show check-out if after office start time and before 2 hours after office end
        if (canCheckOut) {
          const checkOutStart = new Date(officeStart)
          const checkOutEnd = new Date(officeEnd)
          checkOutEnd.setHours(checkOutEnd.getHours() + 2)
          canCheckOut = now >= checkOutStart && now <= checkOutEnd
        }
      }
    } catch (error: any) {
      console.error('Error getting policy:', error)
      // Continue with default behavior if policy fetch fails
      // If policy table doesn't exist, allow check-in/out (graceful degradation)
      if (!error.message?.includes('relation') && !error.message?.includes('does not exist')) {
        // Only log if it's not a table missing error
      }
    }

    if (!attendance) {
      return NextResponse.json({
        hasAttendance: false,
        isOnLeave: false,
        canCheckIn: attendanceEnabled && canCheckIn,
        attendanceEnabled,
        status: null,
        checkIn: null,
        checkOut: null,
        policy: policy ? {
          officeStartTime: policy.officeStartTime,
          officeEndTime: policy.officeEndTime,
        } : null,
      })
    }

    return NextResponse.json({
      hasAttendance: true,
      isOnLeave: false,
      canCheckIn: attendanceEnabled && canCheckIn,
      canCheckOut: attendanceEnabled && canCheckOut,
      attendanceEnabled,
      status: attendance.status,
      checkIn: attendance.check_in ? new Date(attendance.check_in).toISOString() : null,
      checkOut: attendance.check_out ? new Date(attendance.check_out).toISOString() : null,
      remarks: attendance.remarks,
      isLateEntry: attendance.is_late_entry || false,
      isEarlyExit: attendance.is_early_exit || false,
      workingHours: attendance.working_hours || null,
      policy: policy ? {
        officeStartTime: policy.officeStartTime,
        officeEndTime: policy.officeEndTime,
      } : null,
    })
  } catch (error: any) {
    console.error('Error fetching today attendance:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

