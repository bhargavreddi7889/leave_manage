import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { findLeaveRequests } from '@/lib/db-helpers'
import ApprovalsTable from '@/components/ApprovalsTable'

export default async function AdminApprovalsPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const pendingLeaves = await findLeaveRequests({ status: 'PENDING' })
  const allLeavesData = await findLeaveRequests()
  const limitedLeaves = allLeavesData.slice(0, 50)

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Overview</h1>
          <p className="mt-2 text-gray-600">View all leave requests across the organization (View Only)</p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> As an Admin, you can view all leave requests. You can approve HOD leave requests, while HODs approve employee leave requests.
              </p>
            </div>
          </div>
        </div>

        <ApprovalsTable pendingLeaves={pendingLeaves} allLeaves={limitedLeaves} userRole={session.user.role} />
      </div>
    </Layout>
  )
}

