'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, Download } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface Attendance {
  id: string
  date: string
  checkIn: Date | null
  checkOut: Date | null
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE'
  isLateEntry?: boolean
  isEarlyExit?: boolean
  workingHours?: number | null
}

export default function EmployeeAttendanceView({ userId }: { userId: string }) {
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(1) // First day of month
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })

  const fetchAttendance = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ userId })
      if (startDate) params.append('startDate', startDate)
      if (endDate) params.append('endDate', endDate)

      const response = await fetch(`/api/attendance?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAttendance(data)
      } else {
        toast.error(data.error || 'Failed to fetch attendance')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAttendance()
  }, [startDate, endDate])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800'
      case 'ABSENT':
        return 'bg-red-100 text-red-800'
      case 'HALF_DAY':
        return 'bg-yellow-100 text-yellow-800'
      case 'ON_LEAVE':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-4">
      {/* Simple Date Range Filter */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="label">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div>
            <label className="label">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="input-field"
            />
          </div>

          <div className="flex items-end">
            <a
              href={`/api/reports/attendance?userId=${userId}&startDate=${startDate}&endDate=${endDate}`}
              className="btn-secondary flex items-center space-x-2 w-full justify-center"
              download
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </a>
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">My Attendance Records</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No attendance records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours Worked</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(record.date))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.workingHours !== null && record.workingHours !== undefined
                        ? `${record.workingHours.toFixed(2)} hrs`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

