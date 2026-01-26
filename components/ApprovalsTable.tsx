'use client'

import { useState } from 'react'
import { formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, Calendar, User, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface Leave {
  id: string
  startDate: Date
  endDate: Date
  days: number
  status: string
  reason: string | null
  user: {
    firstName: string
    lastName: string
    employeeId: string
    email: string
  }
  leaveType: {
    name: string
  }
  createdAt: Date
}

export default function ApprovalsTable({ 
  pendingLeaves, 
  allLeaves,
  userRole = 'MANAGER'
}: { 
  pendingLeaves: Leave[]
  allLeaves: Leave[]
  userRole?: string
}) {
  const [processing, setProcessing] = useState<string | null>(null)
  const canApprove = userRole === 'MANAGER' // Only managers can approve

  const handleApproval = async (leaveId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessing(leaveId)
    try {
      const response = await fetch(`/api/leaves/${leaveId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success(`Leave request ${action}d successfully!`)
        // Reload immediately to reflect changes
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        toast.error(result.error || `Failed to ${action} leave request`)
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setProcessing(null)
    }
  }

  return (
    <div className="space-y-6">
      {pendingLeaves.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Pending Approvals ({pendingLeaves.length})
          </h2>
          <div className="space-y-4">
            {pendingLeaves.map((leave) => (
              <div
                key={leave.id}
                className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-semibold text-gray-900">
                          {leave.user.firstName} {leave.user.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          ID: {leave.user.employeeId} • {leave.user.email}
                        </p>
                      </div>
                    </div>
                    <div className="ml-8 space-y-2">
                      <div className="flex items-center space-x-2 text-sm text-gray-600">
                        <Calendar className="w-4 h-4" />
                        <span className="font-medium">{leave.leaveType.name}</span>
                        <span className="mx-2">•</span>
                        <span>{formatDate(leave.startDate)} - {formatDate(leave.endDate)}</span>
                        <span className="mx-2">•</span>
                        <span>{leave.days} day(s)</span>
                      </div>
                      {leave.reason && (
                        <p className="text-sm text-gray-600 ml-6">
                          <strong>Reason:</strong> {leave.reason}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 ml-6">
                        Applied on {formatDate(leave.createdAt)}
                      </p>
                    </div>
                  </div>
                  {canApprove ? (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleApproval(leave.id, 'approve')}
                        disabled={processing === leave.id}
                        className="btn-primary flex items-center space-x-2 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => {
                          const reason = prompt('Enter rejection reason (optional):')
                          if (reason !== null) {
                            handleApproval(leave.id, 'reject', reason || undefined)
                          }
                        }}
                        disabled={processing === leave.id}
                        className="btn-danger flex items-center space-x-2 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">
                      View Only (Manager approval required)
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">All Team Leaves</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Employee
                </th>
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
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {allLeaves.map((leave) => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {leave.user.firstName} {leave.user.lastName}
                    </div>
                    <div className="text-sm text-gray-500">{leave.user.employeeId}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.leaveType.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {leave.days} day(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium ${
                        leave.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : leave.status === 'REJECTED'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {leave.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

