import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { queryMany, query } from '@/lib/db'
import EmployeesTable from '@/components/EmployeesTable'
import EmployeeForm from '@/components/EmployeeForm'

export default async function EmployeesPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  const employeesData = await queryMany(
    `SELECT u.*, 
     h.first_name as hod_first_name, h.last_name as hod_last_name, h.employee_id as hod_employee_id,
     (SELECT COUNT(*) FROM leave_requests WHERE user_id = u.id) as leave_count
     FROM users u
     LEFT JOIN users h ON u.hod_id = h.id
     ORDER BY u.created_at DESC`
  )

  const employees = employeesData.map((emp: any) => ({
    id: emp.id,
    email: emp.email,
    firstName: emp.first_name,
    lastName: emp.last_name,
    employeeId: emp.employee_id,
    phone: emp.phone,
    department: emp.department,
    position: emp.position,
    hodId: emp.hod_id,
    role: emp.role,
    isActive: emp.is_active,
    createdAt: emp.created_at,
    updatedAt: emp.updated_at,
    hod: emp.hod_first_name ? {
      firstName: emp.hod_first_name,
      lastName: emp.hod_last_name,
      employeeId: emp.hod_employee_id,
    } : null,
    _count: {
      leaveRequests: parseInt(emp.leave_count || '0'),
    },
  }))

  const hods = await queryMany(
    `SELECT id, first_name, last_name, employee_id, role
     FROM users 
     WHERE role IN ('HOD', 'ADMIN')
     ORDER BY role DESC, first_name ASC`
  )
  
  const mappedHods = hods.map((h: any) => ({
    id: h.id,
    firstName: h.first_name,
    lastName: h.last_name,
    employeeId: h.employee_id,
    role: h.role,
  }))

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Employee Management</h1>
            <p className="mt-2 text-gray-600">Manage employees and their information</p>
          </div>
        </div>

        <EmployeeForm hods={mappedHods} />

        <EmployeesTable employees={employees} hods={mappedHods} />
      </div>
    </Layout>
  )
}

