'use client'

import { useState } from 'react'
import { Download, FileSpreadsheet, Calendar, Clock, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

export default function EmployeeReports() {
  const [downloadingAttendance, setDownloadingAttendance] = useState(false)
  const [downloadingLeave, setDownloadingLeave] = useState(false)
  const [selectedRange, setSelectedRange] = useState<string | null>('thisMonth')
  const [startDate, setStartDate] = useState(() => {
    const date = new Date()
    date.setDate(1) // First day of current month
    return date.toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  const handleDownloadAttendance = async () => {
    setDownloadingAttendance(true)
    try {
      const params = new URLSearchParams({
        startDate,
        endDate,
      })

      const response = await fetch(`/api/reports/attendance?${params}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate attendance report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Attendance_Report_${startDate}_to_${endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Attendance report downloaded successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate attendance report')
    } finally {
      setDownloadingAttendance(false)
    }
  }

  const handleDownloadLeave = async () => {
    setDownloadingLeave(true)
    try {
      const params = new URLSearchParams({
        format: 'excel',
        startDate,
        endDate,
      })

      const response = await fetch(`/api/reports?${params}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate leave report')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Leave_Report_${startDate}_to_${endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      
      toast.success('Leave report downloaded successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate leave report')
    } finally {
      setDownloadingLeave(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
          Select Date Range
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value)
                setSelectedRange(null) // Clear selection when manually changed
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value)
                setSelectedRange(null) // Clear selection when manually changed
              }}
              max={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Attendance Report Card */}
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-indigo-100 rounded-lg">
                <Clock className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Attendance Report</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Download your attendance records with check-in/out times, status, and working hours
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleDownloadAttendance}
            disabled={downloadingAttendance || !startDate || !endDate}
            className="w-full md:w-auto btn-primary flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>
              {downloadingAttendance ? 'Generating...' : 'Download Attendance Report'}
            </span>
          </button>
        </div>
      </div>

      {/* Leave Report Card */}
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-3 bg-green-100 rounded-lg">
                <FileText className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Leave Report</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Download your leave requests with status, approval dates, and leave type details
                </p>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-6">
          <button
            onClick={handleDownloadLeave}
            disabled={downloadingLeave || !startDate || !endDate}
            className="w-full md:w-auto bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            <FileSpreadsheet className="w-5 h-5" />
            <span>
              {downloadingLeave ? 'Generating...' : 'Download Leave Report'}
            </span>
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card bg-gray-50">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Quick Date Ranges</h4>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              const today = new Date()
              const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
              setStartDate(firstDay.toISOString().split('T')[0])
              setEndDate(today.toISOString().split('T')[0])
              setSelectedRange('thisMonth')
            }}
            className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
              selectedRange === 'thisMonth'
                ? 'bg-indigo-600 text-white border-2 border-indigo-600 shadow-md font-semibold'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const firstDay = new Date(today.getFullYear(), 0, 1)
              setStartDate(firstDay.toISOString().split('T')[0])
              setEndDate(today.toISOString().split('T')[0])
              setSelectedRange('thisYear')
            }}
            className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
              selectedRange === 'thisYear'
                ? 'bg-indigo-600 text-white border-2 border-indigo-600 shadow-md font-semibold'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            This Year
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
              const lastDay = new Date(today.getFullYear(), today.getMonth(), 0)
              setStartDate(lastMonth.toISOString().split('T')[0])
              setEndDate(lastDay.toISOString().split('T')[0])
              setSelectedRange('lastMonth')
            }}
            className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
              selectedRange === 'lastMonth'
                ? 'bg-indigo-600 text-white border-2 border-indigo-600 shadow-md font-semibold'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last Month
          </button>
          <button
            onClick={() => {
              const today = new Date()
              const last30Days = new Date(today)
              last30Days.setDate(last30Days.getDate() - 30)
              setStartDate(last30Days.toISOString().split('T')[0])
              setEndDate(today.toISOString().split('T')[0])
              setSelectedRange('last30Days')
            }}
            className={`px-3 py-1 text-sm rounded-md transition-all duration-200 ${
              selectedRange === 'last30Days'
                ? 'bg-indigo-600 text-white border-2 border-indigo-600 shadow-md font-semibold'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Last 30 Days
          </button>
        </div>
      </div>
    </div>
  )
}

