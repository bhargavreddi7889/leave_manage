'use client'

import { useState, useEffect } from 'react'
import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useRouter } from 'next/navigation'

interface AttendanceSummary {
  totalDays: number
  presentDays: number
  absentDays: number
  halfDays: number
  leaveDays: number
  attendanceRate: number
}

export default function AttendanceSummaryCard({ userId }: { userId?: string }) {
  const router = useRouter()
  const [summary, setSummary] = useState<AttendanceSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | 'year'>('month')

  useEffect(() => {
    const fetchSummary = async () => {
      setLoading(true)
      try {
        const today = new Date()
        const startDate = new Date()
        
        if (period === 'month') {
          startDate.setDate(1) // First day of month
        } else {
          startDate.setMonth(0, 1) // First day of year
        }

        const params = new URLSearchParams({
          startDate: startDate.toISOString().split('T')[0],
          endDate: today.toISOString().split('T')[0],
        })
        
        if (userId) {
          params.append('userId', userId)
        }

        const response = await fetch(`/api/attendance/summary?${params}`)
        const data = await response.json()

        if (response.ok) {
          setSummary(data)
        }
      } catch (error) {
        console.error('Error fetching attendance summary:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSummary()
  }, [userId, period])

  if (loading) {
    return (
      <div className="card">
        <div className="text-center py-4 text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!summary) {
    return null
  }

  const attendanceUrl = userId 
    ? `/employee/attendance`
    : `/hod/attendance`

  return (
    <div 
      className="card"
      onClick={() => router.push(attendanceUrl)}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
          Attendance Summary
        </h3>
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value as 'month' | 'year')}
          className="text-sm border border-gray-300 rounded-md px-2 py-1"
        >
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{summary.presentDays}</div>
          <div className="text-xs text-gray-600 mt-1">Present</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">{summary.absentDays}</div>
          <div className="text-xs text-gray-600 mt-1">Absent</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">{summary.halfDays}</div>
          <div className="text-xs text-gray-600 mt-1">Half Day</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{summary.leaveDays}</div>
          <div className="text-xs text-gray-600 mt-1">On Leave</div>
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Attendance Rate</span>
          <span className="text-lg font-bold text-indigo-600">{summary.attendanceRate.toFixed(1)}%</span>
        </div>
        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${summary.attendanceRate}%` }}
          />
        </div>
      </div>
    </div>
  )
}

