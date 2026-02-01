import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { findUsers, findLeaveRequests, countLeaveRequests } from '@/lib/db-helpers'
import { queryMany } from '@/lib/db'
import PendingApprovalsCard from '@/components/PendingApprovalsCard'
import OnLeaveTodayCard from '@/components/OnLeaveTodayCard'
import TeamAvailabilityCard from '@/components/TeamAvailabilityCard'
import AttendanceCheckInOut from '@/components/AttendanceCheckInOut'
import AttendanceSummaryCard from '@/components/AttendanceSummaryCard'

export default async function HODDashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'HOD') {
    redirect('/dashboard')
  }

  // HOD stats - view team leaves (employees under this HOD)
  const pendingCount = await countLeaveRequests({ status: 'PENDING', hodId: session.user.id })

  // Get team members (employees under this HOD)
  const teamMembersData = await findUsers({ hodId: session.user.id, isActive: true })
  const teamMembers = teamMembersData.map((m: any) => ({
    id: m.id,
    firstName: m.firstName,
    lastName: m.lastName,
    employeeId: m.employeeId,
    email: m.email,
    department: m.department,
    position: m.position,
    isActive: m.isActive,
  }))

  // Get today's date and upcoming dates
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const nextWeek = new Date(today)
  nextWeek.setDate(nextWeek.getDate() + 7)

  // Get team leave requests
  const teamLeavesData = await queryMany(
    `SELECT lr.*, 
     u.first_name, u.last_name, u.employee_id,
     lt.name as leave_type_name
     FROM leave_requests lr
     JOIN users u ON lr.user_id = u.id
     JOIN leave_types lt ON lr.leave_type_id = lt.id
     WHERE u.hod_id = $1 
     AND lr.status = 'APPROVED'
     AND lr.end_date >= $2
     ORDER BY lr.start_date ASC`,
    [session.user.id, today]
  )

  const teamLeaves = teamLeavesData.map((row: any) => ({
    id: row.id,
    startDate: new Date(row.start_date),
    endDate: new Date(row.end_date),
    days: parseFloat(row.days || '0'),
    leaveType: { name: row.leave_type_name },
    user: {
      firstName: row.first_name,
      lastName: row.last_name,
      employeeId: row.employee_id,
    },
  }))

  // Filter today's leaves
  const todayLeaves = teamLeaves.filter((leave: any) => {
    const start = new Date(leave.startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(leave.endDate)
    end.setHours(0, 0, 0, 0)
    return start <= today && end >= today
  })

  // Filter upcoming leaves (next 7 days, not today)
  const upcomingLeaves = teamLeaves.filter((leave: any) => {
    const start = new Date(leave.startDate)
    start.setHours(0, 0, 0, 0)
    return start > today && start <= nextWeek
  })

  // Get team availability - find which team members are on leave today
  const teamMemberIds = teamMembers.map(m => m.id)
  const todayLeavesForAvailability = teamLeaves.filter((leave: any) => {
    const start = new Date(leave.startDate)
    start.setHours(0, 0, 0, 0)
    const end = new Date(leave.endDate)
    end.setHours(0, 0, 0, 0)
    return start <= today && end >= today
  })
  
  // Get user IDs from team leaves to match with team members
  const teamLeavesWithUserIds = await queryMany(
    `SELECT DISTINCT lr.user_id
     FROM leave_requests lr
     JOIN users u ON lr.user_id = u.id
     WHERE u.hod_id = $1 
     AND lr.status = 'APPROVED'
     AND lr.start_date <= $2
     AND lr.end_date >= $2`,
    [session.user.id, today]
  )
  const onLeaveUserIds = new Set(teamLeavesWithUserIds.map((row: any) => row.user_id))

  const teamAvailability = teamMembers.map((member) => ({
    ...member,
    isOnLeave: onLeaveUserIds.has(member.id),
  }))

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header - Reduced size */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg mb-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {session.user.name}!</h1>
              <p className="text-indigo-100 text-sm">HOD Dashboard</p>
            </div>
          </div>
        </div>

        {/* Priority 1: Pending Approvals - BIG and LOUD */}
        <div className="mb-2">
          <PendingApprovalsCard count={pendingCount} />
        </div>

        {/* Attendance Check-In/Out */}
        <div className="mb-2">
          <AttendanceCheckInOut />
        </div>

        {/* Priority 2 & 3: Two Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-2">
          <OnLeaveTodayCard todayLeaves={todayLeaves} upcomingLeaves={upcomingLeaves} />
          <TeamAvailabilityCard teamMembers={teamAvailability} />
        </div>

        {/* Attendance Summary */}
        <div className="mb-2">
          <AttendanceSummaryCard />
        </div>

        {/* Quick Actions - Smaller */}
        <div className="card">
          <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/hod/approvals"
              className="block w-full btn-primary text-center py-2 text-sm"
            >
              Review Requests
            </a>
            <a
              href="/hod/leaves"
              className="block w-full btn-secondary text-center py-2 text-sm"
            >
              My Leaves
            </a>
            <a
              href="/hod/attendance"
              className="block w-full btn-secondary text-center py-2 text-sm"
            >
              Team Attendance
            </a>
            <a
              href="/profile"
              className="block w-full btn-secondary text-center py-2 text-sm col-span-2"
            >
              View Profile
            </a>
          </div>
        </div>
      </div>
    </Layout>
  )
}

