'use client'

import { useState, useEffect } from 'react'
import { Clock, CheckCircle, XCircle, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface TodayAttendance {
  hasAttendance: boolean
  isOnLeave: boolean
  leaveType?: string
  canCheckIn: boolean
  canCheckOut: boolean
  attendanceEnabled?: boolean
  status: string | null
  checkIn: string | null
  checkOut: string | null
  remarks?: string | null
  isLateEntry?: boolean
  isEarlyExit?: boolean
  workingHours?: number | null
  policy?: {
    officeStartTime: string
    officeEndTime: string
  } | null
}

export default function AttendanceCheckInOut() {
  const [attendance, setAttendance] = useState<TodayAttendance | null>(null)
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkingOut, setCheckingOut] = useState(false)

  const fetchTodayAttendance = async () => {
    try {
      const response = await fetch('/api/attendance/today')
      const data = await response.json()
      if (response.ok) {
        setAttendance(data)
      } else {
        console.error('Error fetching attendance:', data.error)
        // Set default state on error
        setAttendance({
          hasAttendance: false,
          isOnLeave: false,
          canCheckIn: false,
          canCheckOut: false,
          status: null,
          checkIn: null,
          checkOut: null,
        })
      }
    } catch (error) {
      console.error('Error fetching attendance:', error)
      // Set default state on error
      setAttendance({
        hasAttendance: false,
        isOnLeave: false,
        canCheckIn: false,
        canCheckOut: false,
        status: null,
        checkIn: null,
        checkOut: null,
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTodayAttendance()
    // Refresh every minute
    const interval = setInterval(fetchTodayAttendance, 60000)
    return () => clearInterval(interval)
  }, [])

  const handleCheckIn = async () => {
    setCheckingIn(true)
    try {
      const response = await fetch('/api/attendance/checkin', {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Checked in successfully!')
        // Immediately refresh to show check-out option
        await fetchTodayAttendance()
        // Force a re-render by updating state
        setLoading(false)
      } else {
        toast.error(result.error || 'Failed to check in')
      }
    } catch (error) {
      console.error('Check-in error:', error)
      toast.error('An error occurred. Please try again.')
    } finally {
      setCheckingIn(false)
    }
  }

  const handleCheckOut = async () => {
    setCheckingOut(true)
    try {
      const response = await fetch('/api/attendance/checkout', {
        method: 'POST',
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Checked out successfully!')
        fetchTodayAttendance()
      } else {
        toast.error(result.error || 'Failed to check out')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setCheckingOut(false)
    }
  }

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-4 text-gray-500">Loading attendance...</div>
      </div>
    )
  }

  if (!attendance) {
    return null
  }

  if (!attendance.attendanceEnabled) {
    return (
      <div className="card bg-red-50 border-l-4 border-red-500">
        <div className="flex items-center space-x-3">
          <XCircle className="w-6 h-6 text-red-600" />
          <div>
            <h3 className="font-semibold text-red-900">Attendance System Disabled</h3>
            <p className="text-sm text-red-700">Check-in/out is currently disabled. Please contact your administrator.</p>
          </div>
        </div>
      </div>
    )
  }

  if (attendance.isOnLeave) {
    return (
      <div className="card bg-blue-50 border-l-4 border-blue-500">
        <div className="flex items-center space-x-3">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="font-semibold text-blue-900">On Leave Today</h3>
            <p className="text-sm text-blue-700">Leave Type: {attendance.leaveType}</p>
          </div>
        </div>
      </div>
    )
  }

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'PRESENT':
        return 'bg-green-100 text-green-800'
      case 'HALF_DAY':
        return 'bg-yellow-100 text-yellow-800'
      case 'ABSENT':
        return 'bg-red-100 text-red-800'
      case 'ON_LEAVE':
        return 'bg-blue-100 text-blue-800'
      case 'MISSED_CHECKOUT':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-indigo-600" />
          Today's Attendance
        </h3>
        {attendance.status && (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(attendance.status)}`}>
            {attendance.status.replace('_', ' ')}
          </span>
        )}
      </div>

      <div className="space-y-4">
        {attendance.checkIn ? (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Checked In: {new Date(attendance.checkIn).toLocaleTimeString()}</span>
            </div>
            {attendance.isLateEntry && (
              <div className="flex items-center space-x-2 text-orange-600 text-sm">
                <span className="px-2 py-1 bg-orange-100 rounded">⚠️ Late Entry</span>
              </div>
            )}
            {attendance.policy && (
              <p className="text-xs text-gray-500">Office Start: {attendance.policy.officeStartTime}</p>
            )}
          </div>
        ) : attendance.canCheckIn ? (
          <button
            onClick={handleCheckIn}
            disabled={checkingIn}
            className="w-full btn-primary flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            <Clock className="w-5 h-5" />
            <span>{checkingIn ? 'Checking In...' : 'Check In'}</span>
          </button>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              {attendance.policy ? (
                <>Check-in available from {attendance.policy.officeStartTime} (1 hour before office start)</>
              ) : (
                <>Check-in not available at this time</>
              )}
            </p>
          </div>
        )}

        {attendance.checkIn && !attendance.checkOut && (
          attendance.canCheckOut ? (
            <button
              onClick={handleCheckOut}
              disabled={checkingOut}
              className="w-full btn-secondary flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              <XCircle className="w-5 h-5" />
              <span>{checkingOut ? 'Checking Out...' : 'Check Out'}</span>
            </button>
          ) : (
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600 text-center">
                {attendance.policy ? (
                  <>Check-out available after office start time until {attendance.policy.officeEndTime} (2 hours after)</>
                ) : (
                  <>Check-out not available at this time</>
                )}
              </p>
            </div>
          )
        )}

        {attendance.checkOut && (
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-gray-600">
              <XCircle className="w-5 h-5" />
              <span className="font-medium">Checked Out: {new Date(attendance.checkOut).toLocaleTimeString()}</span>
            </div>
            {attendance.isEarlyExit && (
              <div className="flex items-center space-x-2 text-orange-600 text-sm">
                <span className="px-2 py-1 bg-orange-100 rounded">⚠️ Early Exit</span>
              </div>
            )}
            {attendance.workingHours !== null && attendance.workingHours !== undefined && (
              <p className="text-xs text-gray-500">Working Hours: {attendance.workingHours.toFixed(2)} hrs</p>
            )}
            {attendance.policy && (
              <p className="text-xs text-gray-500">Office End: {attendance.policy.officeEndTime}</p>
            )}
          </div>
        )}

        {/* Show missed checkout warning */}
        {attendance.status === 'MISSED_CHECKOUT' && (
          <div className="p-4 bg-orange-50 border-l-4 border-orange-500 rounded">
            <div className="flex items-center space-x-2 mb-2">
              <XCircle className="w-5 h-5 text-orange-600" />
              <h4 className="font-semibold text-orange-900">Missed Checkout</h4>
            </div>
            <p className="text-sm text-orange-800 mb-2">
              You checked in but did not check out. Your attendance is pending admin review.
            </p>
            <p className="text-xs text-orange-700">
              Working hours will be calculated once an admin reviews and updates your checkout time.
            </p>
          </div>
        )}

        {attendance.remarks && (
          <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
            <strong>Remarks:</strong> {attendance.remarks}
          </div>
        )}
      </div>
    </div>
  )
}

