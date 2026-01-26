import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { findLeaveRequests } from '@/lib/db-helpers'
import ApprovalsTable from '@/components/ApprovalsTable'

export default async function ApprovalsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'MANAGER' && session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const pendingLeaves = session.user.role === 'ADMIN'
    ? await findLeaveRequests({ status: 'PENDING' })
    : await findLeaveRequests({ status: 'PENDING', managerId: session.user.id })

  const allLeavesData = session.user.role === 'ADMIN'
    ? await findLeaveRequests()
    : await findLeaveRequests({ managerId: session.user.id })
  
  const limitedLeaves = allLeavesData.slice(0, 50)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Approvals</h1>
          <p className="mt-2 text-gray-600">Review and approve leave requests from your team</p>
        </div>

        <ApprovalsTable pendingLeaves={pendingLeaves} allLeaves={limitedLeaves} userRole={session.user.role} />
      </div>
    </Layout>
  )
}

