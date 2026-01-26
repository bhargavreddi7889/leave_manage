'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Calendar, Edit, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import EditLeaveModal from './EditLeaveModal'

interface Leave {
  id: string
  startDate: Date
  endDate: Date
  days: number
  status: string
  reason: string | null
  leaveType: {
    id: string
    name: string
  }
  createdAt: Date
  approvedAt: Date | null
}

export default function LeavesTable({ leaves }: { leaves: Leave[] }) {
  const [editingLeave, setEditingLeave] = useState<Leave | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'REJECTED':
        return <XCircle className="w-5 h-5 text-red-500" />
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const handleCancel = async (leaveId: string) => {
    if (!confirm('Are you sure you want to cancel this leave request?')) {
      return
    }

    setDeletingId(leaveId)
    try {
      const response = await fetch(`/api/leaves/${leaveId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        toast.success('Leave request cancelled successfully')
        window.location.reload()
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to cancel leave request')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="card">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">All Leave Requests</h2>
      {leaves.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No leave requests found</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Leave Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date Range
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Days
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied On
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(leave.status)}
                      <span className="ml-2 text-sm font-medium text-gray-900">
                        {leave.leaveType.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="w-4 h-4 mr-2" />
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.days} day(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                        leave.status
                      )}`}
                    >
                      {leave.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(leave.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {leave.status === 'PENDING' && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => setEditingLeave(leave)}
                          className="text-indigo-600 hover:text-indigo-900 p-2 hover:bg-indigo-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleCancel(leave.id)}
                          disabled={deletingId === leave.id}
                          className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Cancel"
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
      )}
      {editingLeave && (
        <EditLeaveModal
          leave={editingLeave}
          onClose={() => setEditingLeave(null)}
          onSuccess={() => {
            setEditingLeave(null)
            window.location.reload()
          }}
        />
      )}
    </div>
  )
}

