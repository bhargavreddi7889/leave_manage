'use client'

import { useState } from 'react'
import { Edit, Save, X, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface LeaveType {
  id: string
  name: string
  type: string
  maxDays: number
  carryForward: boolean
  isActive: boolean
}

export default function PoliciesTable({ leaveTypes: initialLeaveTypes }: { leaveTypes: LeaveType[] }) {
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<{ maxDays?: number; carryForward?: boolean; isActive?: boolean }>({})
  const [leaveTypes, setLeaveTypes] = useState(initialLeaveTypes)

  const handleEdit = (type: LeaveType) => {
    setEditing(type.id)
    setEditData({
      maxDays: type.maxDays,
      carryForward: type.carryForward,
      isActive: type.isActive,
    })
  }

  const handleCancel = () => {
    setEditing(null)
    setEditData({})
  }

  const handleSave = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/leave-types/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      if (response.ok) {
        const updated = await response.json()
        setLeaveTypes(leaveTypes.map(lt => lt.id === id ? {
          ...lt,
          maxDays: updated.maxDays,
          carryForward: updated.carryForward,
          isActive: updated.isActive,
        } : lt))
        toast.success('Leave policy updated successfully!')
        setEditing(null)
        setEditData({})
        window.location.reload() // Reload to reflect changes everywhere
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to update leave policy')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/leave-types/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Leave type deleted successfully!')
        setLeaveTypes(leaveTypes.filter(lt => lt.id !== id))
        window.location.reload()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to delete leave type')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Leave Types</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Max Days
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Carry Forward
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {leaveTypes.map((type) => (
              <tr key={type.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {type.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {type.type}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === type.id ? (
                    <input
                      type="number"
                      min="0"
                      value={editData.maxDays ?? type.maxDays}
                      onChange={(e) => setEditData({ ...editData, maxDays: parseInt(e.target.value) })}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 w-20 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  ) : (
                    <span className="text-sm text-gray-900">{type.maxDays} days</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === type.id ? (
                    <select
                      value={editData.carryForward !== undefined ? (editData.carryForward ? 'true' : 'false') : (type.carryForward ? 'true' : 'false')}
                      onChange={(e) => setEditData({ ...editData, carryForward: e.target.value === 'true' })}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="false">No</option>
                      <option value="true">Yes</option>
                    </select>
                  ) : (
                    <span className="text-sm text-gray-500">
                      {type.carryForward ? (
                        <span className="text-green-600">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {editing === type.id ? (
                    <select
                      value={editData.isActive !== undefined ? (editData.isActive ? 'true' : 'false') : (type.isActive ? 'true' : 'false')}
                      onChange={(e) => setEditData({ ...editData, isActive: e.target.value === 'true' })}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="true">Active</option>
                      <option value="false">Inactive</option>
                    </select>
                  ) : (
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        type.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {type.isActive ? 'Active' : 'Inactive'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {editing === type.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleSave(type.id)}
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
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEdit(type)}
                        className="text-indigo-600 hover:text-indigo-900"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(type.id, type.name)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

