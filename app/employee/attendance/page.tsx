import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import EmployeeAttendanceView from '@/components/EmployeeAttendanceView'

export default async function EmployeeAttendancePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'EMPLOYEE') {
    redirect('/dashboard')
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Attendance</h1>
          <p className="mt-2 text-gray-600">View your check-in, check-out times and working hours</p>
        </div>

        <EmployeeAttendanceView userId={session.user.id} />
      </div>
    </Layout>
  )
}

