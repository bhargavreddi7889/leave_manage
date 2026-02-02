'use client'

import { useState } from 'react'
import { User, Mail, Phone, Building, Briefcase, Trash2, Edit, Save, X, Smartphone } from 'lucide-react'
import toast from 'react-hot-toast'

interface Employee {
  id: string
  email: string | null
  mobile: string | null
  firstName: string
  lastName: string
  employeeId: string
  phone: string | null
  department: string | null
  position: string | null
  role: string
  isActive: boolean
  hodId?: string | null
  hod: {
    firstName: string
    lastName: string
    employeeId: string
  } | null
  _count: {
    leaveRequests: number
  }
}

interface HOD {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  role?: string
}

export default function EmployeesTable({ 
  employees, 
  hods 
}: { 
  employees: Employee[]
  hods: HOD[]
}) {
  const [deleting, setDeleting] = useState<string | null>(null)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ 
    firstName?: string
    lastName?: string
    employeeId?: string
    email?: string
    mobile?: string
    phone?: string
    department?: string
    position?: string
    role?: string
    hodId?: string
    isActive?: boolean
  }>({})

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this employee?')) {
      return
    }

    setDeleting(id)
    try {
      const response = await fetch(`/api/admin/employees/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Employee deleted successfully!')
        window.location.reload()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete employee')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setDeleting(null)
    }
  }

  const handleEdit = (employee: Employee) => {
    setEditing(employee.id)
    setEditData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      employeeId: employee.employeeId,
      email: employee.email || '',
      mobile: employee.mobile || '',
      phone: employee.phone || '',
      department: employee.department || '',
      position: employee.position || '',
      role: employee.role,
      // Admin users should never have a HOD assigned
      hodId: employee.role === 'ADMIN' ? '' : (employee.hodId || ''),
      isActive: employee.isActive,
    })
  }

  const handleCancel = () => {
    setEditing(null)
    setEditData({})
  }

  const handleSave = async (id: string) => {
    try {
      // Ensure Admin users never have a HOD assigned
      const employee = employees.find(e => e.id === id)
      const saveData = { ...editData }
      if (employee?.role === 'ADMIN' || saveData.role === 'ADMIN') {
        saveData.hodId = ''
      }

      const response = await fetch(`/api/admin/employees/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saveData),
      })

      if (response.ok) {
        toast.success('Employee updated successfully!')
        setEditing(null)
        setEditData({})
        // Small delay before reload to show success message
        setTimeout(() => {
          window.location.reload()
        }, 300)
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to update employee')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800'
      case 'HOD':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">All Employees</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200" style={{ minWidth: editing ? '1200px' : 'auto' }}>
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Employee
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Contact
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Department
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                HOD
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leaves
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.map((employee) => (
              <tr key={employee.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === employee.id ? (
                    <div className="space-y-2">
                      <div>
                        <input
                          type="text"
                          value={editData.firstName || ''}
                          onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                          placeholder="First Name"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editData.lastName || ''}
                          onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                          placeholder="Last Name"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editData.employeeId || ''}
                          onChange={(e) => setEditData({ ...editData, employeeId: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                          placeholder="Employee ID"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {employee.firstName} {employee.lastName}
                        </div>
                        <div className="text-sm text-gray-500">ID: {employee.employeeId}</div>
                      </div>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === employee.id ? (
                    <div className="space-y-2">
                      <div>
                        <input
                          type="email"
                          value={editData.email || ''}
                          onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                          placeholder="Email (optional)"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          value={editData.mobile || ''}
                          onChange={(e) => setEditData({ ...editData, mobile: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                          placeholder="Mobile Number"
                        />
                      </div>
                      <div>
                        <input
                          type="tel"
                          value={editData.phone || ''}
                          onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                          placeholder="Phone (optional)"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {employee.email && (
                        <div className="text-sm text-gray-900 flex items-center space-x-1">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span>{employee.email}</span>
                        </div>
                      )}
                      {employee.mobile && (
                        <div className="text-sm text-gray-900 flex items-center space-x-1 mt-1">
                          <Smartphone className="w-4 h-4 text-gray-400" />
                          <span>{employee.mobile}</span>
                        </div>
                      )}
                      {employee.phone && (
                        <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{employee.phone}</span>
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === employee.id ? (
                    <div className="space-y-2">
                      <div>
                        <input
                          type="text"
                          value={editData.department || ''}
                          onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                          placeholder="Department"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editData.position || ''}
                          onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                          className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                          placeholder="Position"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {employee.department && (
                        <div className="text-sm text-gray-900 flex items-center space-x-1">
                          <Building className="w-4 h-4 text-gray-400" />
                          <span>{employee.department}</span>
                        </div>
                      )}
                      {employee.position && (
                        <div className="text-sm text-gray-500 flex items-center space-x-1 mt-1">
                          <Briefcase className="w-4 h-4 text-gray-400" />
                          <span>{employee.position}</span>
                        </div>
                      )}
                    </>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {employee.role === 'ADMIN' ? (
                    <span className="text-gray-400 italic">N/A - Ultimate User</span>
                  ) : editing === employee.id ? (
                    <select
                      value={editData.hodId || ''}
                      onChange={(e) => setEditData({ ...editData, hodId: e.target.value || undefined })}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
                      title="Reporting HOD"
                    >
                      <option value="">No HOD</option>
                      {hods && Array.isArray(hods) && hods.length > 0 ? (
                        hods.filter((h: HOD) => h.role === 'HOD' && h.id !== employee.id).map((h: HOD) => (
                          <option key={h.id} value={h.id}>
                            {h.firstName} {h.lastName} ({h.employeeId})
                          </option>
                        ))
                      ) : (
                        <option disabled>No HODs available</option>
                      )}
                    </select>
                  ) : (
                    employee.hod ? (
                      `${employee.hod.firstName} ${employee.hod.lastName}`
                    ) : (
                      <span className="text-yellow-600 font-medium">Not Assigned</span>
                    )
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === employee.id ? (
                    <select
                      value={editData.role || employee.role}
                      onChange={(e) => setEditData({ ...editData, role: e.target.value })}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="EMPLOYEE">EMPLOYEE</option>
                      <option value="HOD">HOD</option>
                      <option value="ADMIN">ADMIN</option>
                    </select>
                  ) : (
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                      {employee.role}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === employee.id ? (
                    <select
                      value={editData.isActive !== undefined ? (editData.isActive ? 'true' : 'false') : (employee.isActive ? 'true' : 'false')}
                      onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'true' })}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${employee.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {employee.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {employee._count.leaveRequests}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex items-center space-x-2">
                    {editing === employee.id ? (
                      <>
                        <button
                          onClick={() => handleSave(employee.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Save"
                        >
                          <Save className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="text-gray-600 hover:text-gray-900"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEdit(employee)}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(employee.id)}
                          disabled={deleting === employee.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

