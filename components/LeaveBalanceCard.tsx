'use client'

import { Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Balance {
  leaveType: {
    id: string
    name: string
    type: string
  }
  balance: number
  maxDays: number
  oldBalance?: number
  currentYearEarned?: number
  yearlyEarnCap?: number
}

export default function LeaveBalanceCard({ balances }: { balances: Balance[] }) {
  const router = useRouter()

  return (
    <div
      className="card hover:shadow-xl hover:-translate-y-1 hover:scale-[1.02] transition-all duration-300 cursor-pointer active:scale-95"
      onClick={() => router.push('/employee/leaves')}
    >
      <div className="flex items-center space-x-2 mb-3">
        <Calendar className="w-4 h-4 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Leave Balance</h2>
      </div>
      <div className="space-y-3">
        {balances.map((balance) => {
          const isEarnLeave = balance.leaveType.type === 'EARN_LEAVE'
          const isZero = balance.balance <= 0
          const isExceeded = balance.balance > balance.maxDays

          // Cap percentage at 100 for bar width; use raw value only for color logic
          const rawPercentage = balance.maxDays > 0
            ? (balance.balance / balance.maxDays) * 100
            : 0
          const barWidth = Math.min(rawPercentage, 100)

          // Color: red = 0 balance, yellow = ≤25%, orange = ≤50%, green = >50%, blue = exceeded
          const barColor = isZero
            ? 'bg-red-500 hover:bg-red-600'
            : isExceeded
            ? 'bg-blue-500 hover:bg-blue-600'
            : rawPercentage <= 25
            ? 'bg-red-500 hover:bg-red-600'
            : rawPercentage <= 50
            ? 'bg-yellow-500 hover:bg-yellow-600'
            : 'bg-green-500 hover:bg-green-600'

          return (
            <div key={balance.leaveType.id} className="hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  {balance.leaveType.name}
                </span>
                <span className={`text-sm font-semibold ${isZero ? 'text-red-600' : 'text-gray-600'}`}>
                  {balance.balance} / {balance.maxDays} days
                </span>
              </div>

              {/* Earn Leave breakdown tooltip */}
              {isEarnLeave && (balance.oldBalance !== undefined || balance.currentYearEarned !== undefined) && (
                <p className="text-xs text-gray-400 mb-1">
                  {balance.oldBalance ? `${balance.oldBalance} carried` : '0 carried'} +{' '}
                  {balance.currentYearEarned ?? 0} earned this year
                  {' '}(max {balance.yearlyEarnCap ?? 18}/yr)
                </p>
              )}

              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 hover:h-3 ${barColor}`}
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {isZero && (
                <p className="text-xs text-red-500 mt-1 font-medium">No balance remaining</p>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
