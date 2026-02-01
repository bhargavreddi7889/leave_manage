import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { getLeaveBalance } from '@/lib/leave-calculations'
import { findLeaveRequests, findActiveLeaveTypes, findUserById } from '@/lib/db-helpers'
import LeaveApplicationForm from '@/components/LeaveApplicationForm'
import LeavesTable from '@/components/LeavesTable'

export default async function HODLeavesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'HOD') {
    redirect('/dashboard')
  }

  const currentYear = new Date().getFullYear()
  const leaveBalances = await getLeaveBalance(session.user.id, currentYear)

  const leaves = await findLeaveRequests({ userId: session.user.id })
  const leaveTypesData = await findActiveLeaveTypes()
  
  const leaveTypes = leaveTypesData.map((lt: any) => ({
    id: lt.id,
    name: lt.name,
    type: lt.type,
    maxDays: lt.maxDays,
    carryForward: lt.carryForward,
    isActive: lt.isActive,
  }))

  // Check if HOD has an Admin assigned (for HOD leave approval)
  const user = await findUserById(session.user.id)
  const hasHod = !!user?.hodId // HOD's manager is Admin

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Leave Requests</h1>
          <p className="mt-2 text-gray-600">Apply for leave and track your requests</p>
        </div>

        {!hasHod && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  <strong>Notice:</strong> You cannot apply for leave until an Admin is assigned as your reporting manager. Please contact your administrator.
                </p>
              </div>
            </div>
          </div>
        )}

        <LeaveApplicationForm leaveTypes={leaveTypes} balances={leaveBalances} hasManager={hasHod} />

        <LeavesTable leaves={leaves} />
      </div>
    </Layout>
  )
}

