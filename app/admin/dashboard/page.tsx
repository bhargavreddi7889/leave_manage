import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { findUserById, findUsers, findLeaveRequests, countLeaveRequests } from '@/lib/db-helpers'
import DashboardStats from '@/components/DashboardStats'
import RecentLeaves from '@/components/RecentLeaves'
import ReportsButton from '@/components/ReportsButton'

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Admin stats - view all leaves (not personal)
  const allTeamLeaves = await findLeaveRequests()
  const recentLeaves = allTeamLeaves.slice(0, 10).map((leave: any) => ({
    ...leave,
    leaveType: leave.leaveType,
  }))

  const pendingCount = await countLeaveRequests({ status: 'PENDING' })
  const approvedCount = await countLeaveRequests({ status: 'APPROVED' })
  const rejectedCount = await countLeaveRequests({ status: 'REJECTED' })
  const totalCount = await countLeaveRequests()

  const stats = {
    totalLeaves: totalCount,
    pendingLeaves: pendingCount,
    approvedLeaves: approvedCount,
    rejectedLeaves: rejectedCount,
  }

  const teamStats = {
    pendingApprovals: pendingCount,
    teamLeaves: recentLeaves,
  }

  // Get all team members
  const teamMembersData = await findUsers({ isActive: true })
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

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header - Reduced size */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl p-6 text-white shadow-lg">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold mb-1">Welcome back, {session.user.name}!</h1>
              <p className="text-indigo-100 text-sm">HR & Admin Dashboard</p>
            </div>
            <ReportsButton />
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardStats stats={stats} teamStats={teamStats} role={session.user.role} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <RecentLeaves leaves={recentLeaves} />
            
            {/* Team Members Section - Reduced size */}
            {teamMembers && (
              <div className="card">
                <h2 className="text-lg font-bold text-gray-900 mb-3 flex items-center">
                  <span className="w-1 h-5 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full mr-2"></span>
                  All Employees ({teamMembers.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {teamMembers.slice(0, 6).map((member) => (
                    <div
                      key={member.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-indigo-300 hover:shadow-md hover:bg-indigo-50 transition-all duration-300 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-xs text-gray-600">{member.employeeId}</p>
                          {member.department && (
                            <p className="text-xs text-gray-500 mt-1">{member.department}</p>
                          )}
                        </div>
                        <div className={`w-2 h-2 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                      </div>
                    </div>
                  ))}
                </div>
                {teamMembers.length > 6 && (
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    +{teamMembers.length - 6} more employees
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="space-y-4">
            {/* Quick Actions - Reduced size */}
            <div className="card">
              <h2 className="text-lg font-bold text-gray-900 mb-3">Quick Actions</h2>
              <div className="space-y-2">
                <a
                  href="/admin/employees"
                  className="block w-full btn-primary text-center py-2 text-sm"
                >
                  Manage Employees
                </a>
                <a
                  href="/admin/policies"
                  className="block w-full btn-secondary text-center py-2 text-sm"
                >
                  Manage Policies
                </a>
                <a
                  href="/admin/approvals"
                  className="block w-full btn-secondary text-center py-2 text-sm"
                >
                  View All Leaves
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

