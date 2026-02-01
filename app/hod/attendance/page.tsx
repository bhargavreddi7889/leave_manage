import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import AttendanceReport from '@/components/AttendanceReport'
import { queryMany } from '@/lib/db'

export default async function HODAttendancePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  if (session.user.role !== 'HOD') {
    redirect('/dashboard')
  }

  // Get team members for HOD
  const teamMembers = await queryMany(
    `SELECT id, first_name, last_name, employee_id, email, department
     FROM users
     WHERE hod_id = $1 AND is_active = true
     ORDER BY first_name ASC`,
    [session.user.id]
  )

  const users = teamMembers.map((u: any) => ({
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
          <h1 className="text-3xl font-bold text-gray-900">Team Attendance</h1>
          <p className="mt-2 text-gray-600">View and manage team member attendance with check-in/check-out times</p>
        </div>

        <AttendanceReport userId={session.user.id} userRole={session.user.role} teamMembers={users} />
      </div>
    </Layout>
  )
}

