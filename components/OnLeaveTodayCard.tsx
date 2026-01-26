'use client'

import { Calendar, User } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface Leave {
  id: string
  startDate: Date | string
  endDate: Date | string
  days: number
  leaveType: {
    name: string
  }
  user: {
    firstName: string
    lastName: string
    employeeId: string
  }
}

interface OnLeaveTodayCardProps {
  todayLeaves: Leave[]
  upcomingLeaves: Leave[]
}

export default function OnLeaveTodayCard({ todayLeaves, upcomingLeaves }: OnLeaveTodayCardProps) {
  return (
    <div className="card">
      <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
        <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
        Team on Leave
      </h2>
      
      {todayLeaves.length === 0 && upcomingLeaves.length === 0 ? (
        <p className="text-gray-500 text-center py-4 text-sm">No team members on leave</p>
      ) : (
        <div className="space-y-4">
          {todayLeaves.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Today</h3>
              <div className="space-y-2">
                {todayLeaves.slice(0, 3).map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-2 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 hover:border-orange-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-orange-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {leave.user.firstName} {leave.user.lastName}
                        </p>
                        <p className="text-xs text-gray-600">{leave.leaveType.name}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{leave.days} day(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {upcomingLeaves.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Upcoming</h3>
              <div className="space-y-2">
                {upcomingLeaves.slice(0, 3).map((leave) => (
                  <div
                    key={leave.id}
                    className="flex items-center justify-between p-2 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 hover:border-blue-300 hover:shadow-md transition-all duration-300 cursor-pointer group"
                  >
                    <div className="flex items-center space-x-2">
                      <User className="w-4 h-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {leave.user.firstName} {leave.user.lastName}
                        </p>
                        <p className="text-xs text-gray-600">
                          {formatDate(leave.startDate)} - {formatDate(leave.endDate)}
                        </p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">{leave.days} day(s)</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

