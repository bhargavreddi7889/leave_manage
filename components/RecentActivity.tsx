'use client'

import { formatDate } from '@/lib/utils'
import { FileText, CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from 'next/navigation'

interface ActivityItem {
  id: string
  type: string
  user: string
  employeeId: string
  leaveType?: string
  status: string
  createdAt: Date
  startDate?: Date
  endDate?: Date
}

export default function RecentActivity({ activities }: { activities: ActivityItem[] }) {
  const router = useRouter()

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />
      default:
        return <Clock className="w-4 h-4 text-yellow-500" />
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
    <div className="card w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h2>
      {activities.length === 0 ? (
        <p className="text-gray-500 text-center py-8">No recent activity</p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {activities.slice(0, 10).map((activity) => (
            <div
              key={activity.id}
              onClick={() => router.push(`/admin/approvals?id=${activity.id}`)}
              className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 hover:shadow-md hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-300 cursor-pointer active:scale-95"
            >
              <div className="flex items-center space-x-3 flex-1">
                {getStatusIcon(activity.status)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900">{activity.user}</p>
                    <span className="text-xs text-gray-500">({activity.employeeId})</span>
                  </div>
                  {activity.type === 'leave' && (
                    <div className="text-sm text-gray-600 mt-1">
                      <span className="font-medium">{activity.leaveType}</span>
                      {activity.startDate && activity.endDate && (
                        <span className="ml-2">
                          • {formatDate(new Date(activity.startDate))} - {formatDate(new Date(activity.endDate))}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                {activity.status}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

