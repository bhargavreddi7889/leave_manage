'use client'

import { useState, useEffect } from 'react'
import { Calendar, Clock, User, Download, Edit, Save, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatDate } from '@/lib/utils'

interface User {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  email?: string
  department?: string | null
}

interface Attendance {
  id: string
  userId: string
  date: string
  checkIn: Date | null
  checkOut: Date | null
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'ON_LEAVE'
  remarks: string | null
  isLateEntry?: boolean
  isEarlyExit?: boolean
  workingHours?: number | null
  user: {
    firstName: string
    lastName: string
    employeeId: string
    email: string
    department: string | null
    position: string | null
  }
}

export default function AdminAttendanceView({ 
  allUsers,
  currentUserId 
}: { 
  allUsers: User[]
  currentUserId: string
}) {
  const [selectedUserId, setSelectedUserId] = useState<string>('')
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date()
    date.setDate(1)
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [attendance, setAttendance] = useState<Attendance[]>([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editData, setEditData] = useState<{
    checkIn?: string
    checkOut?: string
    status?: string
    remarks?: string
    overrideReason?: string
  }>({})

  const fetchAttendance = async () => {
    if (!selectedUserId) {
      setAttendance([])
      return
    }

    setLoading(true)
    try {
      const params = new URLSearchParams({ userId: selectedUserId })
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
    if (selectedUserId) {
      fetchAttendance()
    }
  }, [selectedUserId, startDate, endDate])

  const handleSave = async (attendanceId: string) => {
    try {
      const response = await fetch(`/api/attendance/${attendanceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editData),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Attendance updated successfully!')
        setEditing(null)
        setEditData({})
        fetchAttendance()
      } else {
        toast.error(result.error || 'Failed to update attendance')
      }
    } catch (error) {
      toast.error('An error occurred')
    }
  }

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
      {/* Filters */}
      <div className="card">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="label">Select Employee</label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="input-field"
            >
              <option value="">All Employees</option>
              {allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.employeeId})
                </option>
              ))}
            </select>
          </div>

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
            {selectedUserId && attendance.length > 0 && (
              <a
                href={`/api/reports/attendance?userId=${selectedUserId}&startDate=${startDate}&endDate=${endDate}`}
                className="btn-secondary flex items-center space-x-2 w-full justify-center"
                download
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Attendance Table */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Attendance Records</h2>
        
        {loading ? (
          <div className="text-center py-8 text-gray-500">Loading...</div>
        ) : !selectedUserId ? (
          <div className="text-center py-8 text-gray-500">Select an employee to view attendance</div>
        ) : attendance.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No attendance records found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check In</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Check Out</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Remarks</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {attendance.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(new Date(record.date))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {record.user.firstName} {record.user.lastName}
                      </div>
                      <div className="text-sm text-gray-500">{record.user.employeeId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editing === record.id ? (
                        <input
                          type="time"
                          value={editData.checkIn || (record.checkIn ? new Date(record.checkIn).toTimeString().slice(0, 5) : '')}
                          onChange={(e) => setEditData({ ...editData, checkIn: e.target.value })}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <div>
                          {record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-'}
                          {record.isLateEntry && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">Late</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {editing === record.id ? (
                        <input
                          type="time"
                          value={editData.checkOut || (record.checkOut ? new Date(record.checkOut).toTimeString().slice(0, 5) : '')}
                          onChange={(e) => setEditData({ ...editData, checkOut: e.target.value })}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        />
                      ) : (
                        <div>
                          {record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-'}
                          {record.isEarlyExit && (
                            <span className="ml-2 px-2 py-0.5 bg-orange-100 text-orange-800 text-xs rounded">Early</span>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {record.workingHours !== null && record.workingHours !== undefined
                        ? `${record.workingHours.toFixed(2)} hrs`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editing === record.id ? (
                        <select
                          value={editData.status || record.status}
                          onChange={(e) => setEditData({ ...editData, status: e.target.value })}
                          className="text-sm border border-gray-300 rounded px-2 py-1"
                        >
                          <option value="PRESENT">Present</option>
                          <option value="ABSENT">Absent</option>
                          <option value="HALF_DAY">Half Day</option>
                          <option value="ON_LEAVE">On Leave</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                          {record.status.replace('_', ' ')}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {editing === record.id ? (
                        <input
                          type="text"
                          value={editData.remarks || record.remarks || ''}
                          onChange={(e) => setEditData({ ...editData, remarks: e.target.value })}
                          className="text-sm border border-gray-300 rounded px-2 py-1 w-full"
                          placeholder="Remarks"
                        />
                      ) : (
                        record.remarks || '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {editing === record.id ? (
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={editData.overrideReason || ''}
                            onChange={(e) => setEditData({ ...editData, overrideReason: e.target.value })}
                            className="text-xs border border-gray-300 rounded px-2 py-1 w-32"
                            placeholder="Override reason"
                          />
                          <button
                            onClick={() => handleSave(record.id)}
                            className="text-green-600 hover:text-green-900"
                            title="Save"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setEditing(null)
                              setEditData({})
                            }}
                            className="text-red-600 hover:text-red-900"
                            title="Cancel"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditing(record.id)
                            setEditData({
                              checkIn: record.checkIn ? new Date(record.checkIn).toTimeString().slice(0, 5) : '',
                              checkOut: record.checkOut ? new Date(record.checkOut).toTimeString().slice(0, 5) : '',
                              status: record.status,
                              remarks: record.remarks || '',
                            })
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
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

