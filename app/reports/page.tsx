import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import EmployeeReports from '@/components/EmployeeReports'
import AdminReports from '@/components/AdminReports'

export default async function ReportsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const isAdmin = session.user.role === 'ADMIN'

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
          <p className="mt-2 text-gray-600">
            {isAdmin
              ? 'Download attendance and leave reports — filter by department or date range'
              : 'Download your attendance and leave reports'}
          </p>
        </div>

        {isAdmin ? <AdminReports /> : <EmployeeReports />}
      </div>
    </Layout>
  )
}
