'use client'

import { Users, Clock, FileText, Settings, BarChart3 } from 'lucide-react'
import Link from 'next/link'

export default function QuickActions() {
  const actions = [
    {
      label: 'Manage Employees',
      href: '/admin/employees',
      icon: Users,
      color: 'bg-indigo-500',
    },
    {
      label: 'Manage Attendance',
      href: '/admin/attendance',
      icon: Clock,
      color: 'bg-blue-500',
    },
    {
      label: 'Approve Leaves',
      href: '/admin/approvals',
      icon: FileText,
      color: 'bg-green-500',
    },
    {
      label: 'Policies',
      href: '/admin/policies',
      icon: Settings,
      color: 'bg-purple-500',
    },
    {
      label: 'Reports',
      href: '/reports',
      icon: BarChart3,
      color: 'bg-orange-500',
    },
  ]

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
      <div className="space-y-2">
        {actions.map((action) => {
          const Icon = action.icon
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg hover:bg-indigo-50 hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 group active:scale-95"
            >
              <div className={`${action.color} p-2 rounded-lg group-hover:scale-110 transition-transform`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <span className="font-medium text-gray-900 group-hover:text-indigo-700">{action.label}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

