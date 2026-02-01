'use client'

import { Calendar, Clock, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface LeaveSnapshotData {
  total: number
  pending: number
  approved: number
  rejected: number
}

export default function LeaveSnapshot({ data }: { data: LeaveSnapshotData }) {
  const cards = [
    {
      label: 'Total',
      value: data.total,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
    },
    {
      label: 'Pending',
      value: data.pending,
      icon: Clock,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
    },
    {
      label: 'Approved',
      value: data.approved,
      icon: CheckCircle,
      color: 'bg-green-500',
      textColor: 'text-green-700',
    },
    {
      label: 'Rejected',
      value: data.rejected,
      icon: XCircle,
      color: 'bg-red-500',
      textColor: 'text-red-700',
    },
  ]

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Leave Snapshot (This Month)</h2>
        <Link
          href="/admin/approvals"
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          View All →
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map((card) => {
          const Icon = card.icon
          const statusFilter = card.label === 'Total' ? '' : `?status=${card.label.toUpperCase()}`
          return (
            <Link
              key={card.label}
              href={`/admin/approvals${statusFilter}`}
              className="flex flex-col items-center p-4 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer active:scale-95"
            >
              <div className={`${card.color} p-3 rounded-lg mb-2`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{card.value}</p>
              <p className="text-xs text-gray-600 mt-1">{card.label}</p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

