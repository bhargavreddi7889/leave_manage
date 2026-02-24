'use client'

import { useState, useEffect } from 'react'
import { Download, FileSpreadsheet, Calendar, Clock, FileText, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

type RangeKey = 'thisMonth' | 'lastMonth' | 'thisYear' | 'last30Days' | null

function getDefaultDates() {
  const today = new Date()
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
  return {
    start: firstDay.toISOString().split('T')[0],
    end: today.toISOString().split('T')[0],
  }
}

export default function AdminReports() {
  const defaults = getDefaultDates()
  const [startDate, setStartDate] = useState(defaults.start)
  const [endDate, setEndDate]     = useState(defaults.end)
  const [selectedRange, setSelectedRange] = useState<RangeKey>('thisMonth')

  const [departments, setDepartments] = useState<string[]>([])
  const [selectedDept, setSelectedDept] = useState<string>('ALL')

  const [downloadingAttendance, setDownloadingAttendance] = useState(false)
  const [downloadingLeave, setDownloadingLeave]           = useState(false)

  useEffect(() => {
    fetch('/api/admin/departments')
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setDepartments(d) })
      .catch(() => {})
  }, [])

  const setRange = (key: RangeKey, start: string, end: string) => {
    setSelectedRange(key)
    setStartDate(start)
    setEndDate(end)
  }

  const handleDownloadAttendance = async () => {
    setDownloadingAttendance(true)
    try {
      const params = new URLSearchParams({ startDate, endDate })
      if (selectedDept !== 'ALL') params.set('department', selectedDept)

      const response = await fetch(`/api/reports/attendance?${params}`)
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate report')
      }
      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const deptSuffix = selectedDept !== 'ALL' ? `_${selectedDept}` : ''
      a.download = `Attendance_Report${deptSuffix}_${startDate}_to_${endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Attendance report downloaded!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report')
    } finally {
      setDownloadingAttendance(false)
    }
  }

  const handleDownloadLeave = async () => {
    setDownloadingLeave(true)
    try {
      const params = new URLSearchParams({ format: 'excel', startDate, endDate })
      if (selectedDept !== 'ALL') params.set('department', selectedDept)

      const response = await fetch(`/api/reports?${params}`)
      if (!response.ok) {
        const err = await response.json()
        throw new Error(err.error || 'Failed to generate report')
      }
      const blob = await response.blob()
      const url  = window.URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      const deptSuffix = selectedDept !== 'ALL' ? `_${selectedDept}` : ''
      a.download = `Leave_Report${deptSuffix}_${startDate}_to_${endDate}.xlsx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Leave report downloaded!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate report')
    } finally {
      setDownloadingLeave(false)
    }
  }

  const btnClass = (active: boolean) =>
    `px-3 py-1 text-sm rounded-md transition-all duration-200 ${
      active
        ? 'bg-indigo-600 text-white border-2 border-indigo-600 shadow-md font-semibold'
        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
    }`

  return (
    <div className="space-y-6">

      {/* Filters row */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-indigo-600" />
          Filters
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input type="date" value={startDate}
              onChange={e => { setStartDate(e.target.value); setSelectedRange(null) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input type="date" value={endDate} max={new Date().toISOString().split('T')[0]}
              onChange={e => { setEndDate(e.target.value); setSelectedRange(null) }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Building2 className="w-4 h-4" /> Department
            </label>
            <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
              <option value="ALL">All Departments</option>
              {departments.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quick ranges */}
        <div className="flex flex-wrap gap-2">
          <button onClick={() => {
            const t = new Date()
            setRange('thisMonth', new Date(t.getFullYear(), t.getMonth(), 1).toISOString().split('T')[0], t.toISOString().split('T')[0])
          }} className={btnClass(selectedRange === 'thisMonth')}>This Month</button>

          <button onClick={() => {
            const t = new Date()
            setRange('lastMonth',
              new Date(t.getFullYear(), t.getMonth() - 1, 1).toISOString().split('T')[0],
              new Date(t.getFullYear(), t.getMonth(), 0).toISOString().split('T')[0])
          }} className={btnClass(selectedRange === 'lastMonth')}>Last Month</button>

          <button onClick={() => {
            const t = new Date()
            setRange('thisYear', `${t.getFullYear()}-01-01`, t.toISOString().split('T')[0])
          }} className={btnClass(selectedRange === 'thisYear')}>This Year</button>

          <button onClick={() => {
            const t = new Date()
            const d = new Date(t); d.setDate(d.getDate() - 30)
            setRange('last30Days', d.toISOString().split('T')[0], t.toISOString().split('T')[0])
          }} className={btnClass(selectedRange === 'last30Days')}>Last 30 Days</button>
        </div>
      </div>

      {/* Attendance Report */}
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-indigo-100 rounded-lg">
            <Clock className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Attendance Report</h3>
            <p className="text-sm text-gray-500">
              {selectedDept !== 'ALL' ? `Department: ${selectedDept}` : 'All departments'} · Check-in/out timestamps
            </p>
          </div>
        </div>
        <button onClick={handleDownloadAttendance} disabled={downloadingAttendance || !startDate || !endDate}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <FileSpreadsheet className="w-5 h-5" />
          <span>{downloadingAttendance ? 'Generating...' : 'Download Attendance Report'}</span>
        </button>
      </div>

      {/* Leave Report */}
      <div className="card hover:shadow-lg transition-shadow">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-green-100 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">Leave Report</h3>
            <p className="text-sm text-gray-500">
              {selectedDept !== 'ALL' ? `Department: ${selectedDept}` : 'All departments'} · Leave requests & approvals
            </p>
          </div>
        </div>
        <button onClick={handleDownloadLeave} disabled={downloadingLeave || !startDate || !endDate}
          className="w-full md:w-auto bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white px-6 py-3 rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all duration-200 font-semibold shadow-lg flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed">
          <FileSpreadsheet className="w-5 h-5" />
          <span>{downloadingLeave ? 'Generating...' : 'Download Leave Report'}</span>
        </button>
      </div>
    </div>
  )
}
