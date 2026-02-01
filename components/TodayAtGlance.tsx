'use client'

import { Users, UserX, Calendar, Clock, AlertCircle } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface TodayAtGlanceData {
  presentToday: number
  absentToday: number
  onLeaveToday: number
  lateCheckIns: number
  missedCheckOuts: number
}

export default function TodayAtGlance({ data }: { data: TodayAtGlanceData }) {
  const router = useRouter()

  const cards = [
    {
      label: 'Present Today',
      value: data.presentToday,
      icon: Users,
      color: 'bg-green-500',
      textColor: 'text-green-700',
      href: '/admin/attendance?status=PRESENT',
    },
    {
      label: 'Absent Today',
      value: data.absentToday,
      icon: UserX,
      color: 'bg-red-500',
      textColor: 'text-red-700',
      href: '/admin/attendance?status=ABSENT',
    },
    {
      label: 'On Leave Today',
      value: data.onLeaveToday,
      icon: Calendar,
      color: 'bg-blue-500',
      textColor: 'text-blue-700',
      href: '/admin/attendance?status=ON_LEAVE',
    },
    {
      label: 'Late Check-ins',
      value: data.lateCheckIns,
      icon: Clock,
      color: 'bg-orange-500',
      textColor: 'text-orange-700',
      href: '/admin/attendance?late=true',
    },
    {
      label: 'Missed Check-outs',
      value: data.missedCheckOuts,
      icon: AlertCircle,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-700',
      href: '/admin/attendance?missedCheckout=true',
    },
  ]

  return (
    <div className="card w-full">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Today at a Glance</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 overflow-x-auto">
        {cards.map((card) => {
          const Icon = card.icon
          return (
            <div
              key={card.label}
              onClick={() => router.push(card.href)}
              className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:shadow-lg hover:-translate-y-1 hover:scale-105 transition-all duration-300 cursor-pointer active:scale-95"
            >
              <div className={`${card.color} p-2 rounded-lg`}>
                <Icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                <p className="text-xs text-gray-600">{card.label}</p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

