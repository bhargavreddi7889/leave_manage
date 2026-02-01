'use client'

import { Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface AdminAttendance {
  checkIn: string | null
  checkOut: string | null
  workingHours: number | null
  isLateEntry: boolean
  isEarlyExit: boolean
  status: string
}

export default function AdminPersonalAttendance({ attendance }: { attendance: AdminAttendance | null }) {
  const router = useRouter()

  if (!attendance) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">My Attendance Today</h2>
        <div className="text-center py-6 text-gray-500">
          <Clock className="w-8 h-8 mx-auto mb-2" />
          <p>No attendance recorded today</p>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800'
      case 'HALF_DAY':
        return 'bg-yellow-100 text-yellow-800'
      case 'ABSENT':
        return 'bg-red-100 text-red-800'
      case 'ON_LEAVE':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div 
      className="card"
      onClick={() => router.push('/admin/my-attendance')}
    >
      <h2 className="text-lg font-semibold text-gray-900 mb-4">My Attendance Today</h2>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status</span>
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance.status)}`}>
            {attendance.status.replace('_', ' ')}
          </span>
        </div>

        {attendance.checkIn && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">Check-in</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {new Date(attendance.checkIn).toLocaleTimeString()}
            </span>
          </div>
        )}

        {attendance.checkOut && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <div className="flex items-center space-x-2">
              <XCircle className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">Check-out</span>
            </div>
            <span className="text-sm font-medium text-gray-900">
              {new Date(attendance.checkOut).toLocaleTimeString()}
            </span>
          </div>
        )}

        {attendance.workingHours !== null && (
          <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
            <span className="text-sm text-gray-700">Working Hours</span>
            <span className="text-sm font-medium text-gray-900">
              {attendance.workingHours.toFixed(2)} hrs
            </span>
          </div>
        )}

        {(attendance.isLateEntry || attendance.isEarlyExit) && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-200">
            {attendance.isLateEntry && (
              <span className="flex items-center space-x-1 text-xs text-orange-600">
                <AlertCircle className="w-3 h-3" />
                <span>Late Entry</span>
              </span>
            )}
            {attendance.isEarlyExit && (
              <span className="flex items-center space-x-1 text-xs text-orange-600">
                <AlertCircle className="w-3 h-3" />
                <span>Early Exit</span>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

