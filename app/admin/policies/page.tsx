import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { queryMany } from '@/lib/db'
import PoliciesTable from '@/components/PoliciesTable'
import LeaveTypeForm from '@/components/LeaveTypeForm'
import AttendancePolicyForm from '@/components/AttendancePolicyForm'

export default async function PoliciesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const leaveTypesData = await queryMany(
    `SELECT * FROM leave_types ORDER BY created_at DESC`
  )
  
  const leaveTypes = leaveTypesData.map((lt: any) => ({
    id: lt.id,
    name: lt.name,
    type: lt.type,
    maxDays: lt.max_days,
    carryForward: lt.carry_forward,
    isActive: lt.is_active,
    createdAt: lt.created_at,
    updatedAt: lt.updated_at,
  }))

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Leave Policies</h1>
          <p className="mt-2 text-gray-600">Manage leave types and policies</p>
        </div>

        <LeaveTypeForm />

        <PoliciesTable leaveTypes={leaveTypes} />

        <AttendancePolicyForm />
      </div>
    </Layout>
  )
}

