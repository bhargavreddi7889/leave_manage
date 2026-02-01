import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { getLeaveBalance } from '@/lib/leave-calculations'
import { findUserById, findLeaveRequests, countLeaveRequests } from '@/lib/db-helpers'
import DashboardStats from '@/components/DashboardStats'
import RecentLeaves from '@/components/RecentLeaves'
import LeaveBalanceCard from '@/components/LeaveBalanceCard'
import AttendanceCheckInOut from '@/components/AttendanceCheckInOut'
import AttendanceSummaryCard from '@/components/AttendanceSummaryCard'

export default async function EmployeeDashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'EMPLOYEE') {
    redirect('/dashboard')
  }

  const currentYear = new Date().getFullYear()
  const leaveBalances = await getLeaveBalance(session.user.id, currentYear)

  const allLeaves = await findLeaveRequests({ userId: session.user.id })
  const recentLeaves = allLeaves.slice(0, 5).map((leave: any) => ({
    ...leave,
    leaveType: leave.leaveType,
  }))

  const stats = {
    totalLeaves: await countLeaveRequests({ userId: session.user.id }),
    pendingLeaves: await countLeaveRequests({ userId: session.user.id, status: 'PENDING' }),
    approvedLeaves: await countLeaveRequests({ userId: session.user.id, status: 'APPROVED' }),
    rejectedLeaves: await countLeaveRequests({ userId: session.user.id, status: 'REJECTED' }),
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header - Reduced size */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg mb-2">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {session.user.name}!</h1>
              <p className="text-indigo-100 text-sm">Employee Dashboard</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="mb-2">
          <DashboardStats stats={stats} teamStats={null} role={session.user.role} />
        </div>

        {/* Attendance Check-In/Out */}
        <div className="mb-2">
          <AttendanceCheckInOut />
        </div>

        {/* Main Content Grid - Reduced size */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <RecentLeaves leaves={recentLeaves} />
            <AttendanceSummaryCard />
          </div>
          
          <div className="space-y-6">
            <LeaveBalanceCard balances={leaveBalances} />
            
            {/* Quick Actions - Reduced size */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href="/employee/leaves"
                  className="block w-full btn-primary text-center py-2 text-sm"
                >
                  Apply for Leave
                </a>
                <a
                  href="/employee/attendance"
                  className="block w-full btn-secondary text-center py-2 text-sm"
                >
                  View Attendance
                </a>
                <a
                  href="/profile"
                  className="block w-full btn-secondary text-center py-2 text-sm"
                >
                  View Profile
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}

