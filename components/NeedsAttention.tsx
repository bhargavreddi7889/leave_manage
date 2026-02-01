'use client'

import { AlertCircle, Clock, FileText, UserCheck } from 'lucide-react'
import Link from 'next/link'

interface NeedsAttentionData {
  pendingLeaveApprovals: number
  missedCheckOuts: number
  attendanceConflicts: number
}

export default function NeedsAttention({ data }: { data: NeedsAttentionData }) {
  const alerts = [
    {
      label: 'Pending Leave Approvals',
      count: data.pendingLeaveApprovals,
      icon: FileText,
      href: '/admin/approvals',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      label: 'Missed Check-outs',
      count: data.missedCheckOuts,
      icon: Clock,
      href: '/admin/attendance',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      label: 'Attendance Conflicts',
      count: data.attendanceConflicts,
      icon: AlertCircle,
      href: '/admin/attendance',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ].filter(alert => alert.count > 0)

  if (alerts.length === 0) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Needs Attention</h2>
        <div className="flex items-center justify-center py-8 text-gray-500">
          <UserCheck className="w-8 h-8 mr-2" />
          <span>All clear! No pending items.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Needs Attention</h2>
      <div className="space-y-2">
        {alerts.map((alert) => {
          const Icon = alert.icon
          return (
            <Link
              key={alert.label}
              href={alert.href}
              className={`flex items-center justify-between p-3 rounded-lg border border-gray-200 hover:shadow-lg hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer active:scale-95 ${alert.bgColor}`}
            >
              <div className="flex items-center space-x-3">
                <Icon className={`w-5 h-5 ${alert.color}`} />
                <span className="font-medium text-gray-900">{alert.label}</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${alert.color} bg-white`}>
                {alert.count}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

