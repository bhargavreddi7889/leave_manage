'use client'

import { Calendar, Clock, CheckCircle, XCircle, Users } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Stats {
  totalLeaves: number
  pendingLeaves: number
  approvedLeaves: number
  rejectedLeaves: number
}

interface TeamStats {
  pendingApprovals: number
  teamLeaves: any[]
}

export default function DashboardStats({ 
  stats, 
  teamStats, 
  role 
}: { 
  stats: Stats
  teamStats: TeamStats | null
  role: string
}) {
  const router = useRouter()

  const statCards = [
    {
      label: 'Total Leaves',
      value: stats.totalLeaves,
      icon: Calendar,
      color: 'bg-blue-500',
    },
    {
      label: 'Pending',
      value: stats.pendingLeaves,
      icon: Clock,
      color: 'bg-yellow-500',
    },
    {
      label: 'Approved',
      value: stats.approvedLeaves,
      icon: CheckCircle,
      color: 'bg-green-500',
    },
    {
      label: 'Rejected',
      value: stats.rejectedLeaves,
      icon: XCircle,
      color: 'bg-red-500',
    },
  ]

  if (teamStats && (role === 'HOD' || role === 'ADMIN')) {
    statCards.push({
      label: 'Pending Approvals',
      value: teamStats.pendingApprovals,
      icon: Users,
      color: 'bg-purple-500',
    })
  }

  const getGradient = (color: string) => {
    switch (color) {
      case 'bg-blue-500':
        return 'from-blue-500 to-blue-600'
      case 'bg-yellow-500':
        return 'from-yellow-500 to-yellow-600'
      case 'bg-green-500':
        return 'from-green-500 to-green-600'
      case 'bg-red-500':
        return 'from-red-500 to-red-600'
      case 'bg-purple-500':
        return 'from-purple-500 to-purple-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon
        const href = role === 'EMPLOYEE' 
          ? `/employee/leaves${stat.label === 'Total' ? '' : `?status=${stat.label.toUpperCase()}`}`
          : role === 'HOD'
          ? `/hod/approvals${stat.label === 'Pending Approvals' ? '' : `?status=${stat.label.toUpperCase()}`}`
          : `/admin/approvals${stat.label === 'Total Leaves' ? '' : `?status=${stat.label.toUpperCase()}`}`

        return (
          <div 
            key={stat.label} 
            onClick={() => router.push(href)}
            className="card hover:shadow-xl hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer group active:scale-95"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide group-hover:text-gray-800 transition-colors">{stat.label}</p>
                <p className="text-3xl font-bold gradient-text mt-2 group-hover:scale-110 transition-transform duration-300">{stat.value}</p>
              </div>
              <div className={`bg-gradient-to-br ${getGradient(stat.color)} p-3 rounded-lg shadow-md group-hover:scale-110 group-hover:shadow-lg transition-all duration-300`}>
                <Icon className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

