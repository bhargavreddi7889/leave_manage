import { Calendar } from 'lucide-react'

interface Balance {
  leaveType: {
    id: string
    name: string
    type: string
  }
  balance: number
  maxDays: number
}

export default function LeaveBalanceCard({ balances }: { balances: Balance[] }) {
  return (
    <div className="card hover:shadow-xl transition-all duration-300">
      <div className="flex items-center space-x-2 mb-3">
        <Calendar className="w-4 h-4 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Leave Balance</h2>
      </div>
      <div className="space-y-3">
        {balances.map((balance) => {
          const percentage = (balance.balance / balance.maxDays) * 100
          return (
            <div key={balance.leaveType.id} className="hover:bg-gray-50 p-2 rounded-lg transition-colors duration-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                  {balance.leaveType.name}
                </span>
                <span className="text-sm text-gray-600 font-semibold">
                  {balance.balance} / {balance.maxDays} days
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full transition-all duration-500 hover:h-3 ${
                    percentage > 50
                      ? 'bg-green-500 hover:bg-green-600'
                      : percentage > 25
                      ? 'bg-yellow-500 hover:bg-yellow-600'
                      : 'bg-red-500 hover:bg-red-600'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

