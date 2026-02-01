import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import AdminAttendanceView from '@/components/AdminAttendanceView'
import { queryMany } from '@/lib/db'

export default async function AdminAttendancePage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Fetch all users for the dropdown
  const usersData = await queryMany(
    `SELECT id, first_name, last_name, employee_id, email, department
     FROM users
     WHERE is_active = true
     ORDER BY first_name ASC`
  )

  const users = usersData.map((u: any) => ({
    id: u.id,
    firstName: u.first_name,
    lastName: u.last_name,
    employeeId: u.employee_id,
    email: u.email,
    department: u.department,
  }))

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Attendance Management</h1>
          <p className="mt-2 text-gray-600">View and manage all employee attendance records</p>
        </div>

        <AdminAttendanceView allUsers={users} currentUserId={session.user.id} />
      </div>
    </Layout>
  )
}

