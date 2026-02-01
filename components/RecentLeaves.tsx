'use client'

import { formatDate } from '@/lib/utils'
import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Leave {
  id: string
  startDate: Date
  endDate: Date
  days: number
  status: string
  leaveType: {
    name: string
  }
  createdAt: Date
}

export default function RecentLeaves({ leaves }: { leaves: Leave[] }) {
  const router = useRouter()

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
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Leave Requests</h2>
      {leaves.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No leave requests yet</p>
      ) : (
        <div className="space-y-4">
          {leaves.map((leave) => (
            <div
              key={leave.id}
              onClick={() => router.push(`/employee/leaves?id=${leave.id}`)}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-300 cursor-pointer group active:scale-95"
            >
              <div className="flex items-center space-x-4">
                {getStatusIcon(leave.status)}
                <div>
                  <p className="font-medium text-gray-900">{leave.leaveType.name}</p>
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                    </span>
                    <span className="mx-2">•</span>
                    <span>{leave.days} day(s)</span>
                  </div>
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  leave.status
                )}`}
              >
                {leave.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

