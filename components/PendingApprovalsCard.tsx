'use client'

import { AlertCircle, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface PendingApprovalsCardProps {
  count: number
}

export default function PendingApprovalsCard({ count }: PendingApprovalsCardProps) {
  return (
    <Link href="/manager/approvals" className="block">
      <div className="bg-gradient-to-br from-orange-500 via-red-500 to-orange-600 rounded-xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-[1.02] cursor-pointer">
        <div className="flex items-center justify-between text-white">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <AlertCircle className="w-8 h-8" />
              <h3 className="text-2xl font-bold">Pending Approvals</h3>
            </div>
            <p className="text-orange-100 text-lg mb-4">
              {count === 0 
                ? 'No pending approvals' 
                : count === 1 
                  ? '1 leave request needs your attention' 
                  : `${count} leave requests need your attention`}
            </p>
            <div className="flex items-center text-orange-100 font-semibold group">
              <span>Review Now</span>
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
          <div className="text-right">
            <div className="text-6xl font-bold text-white/80">{count}</div>
          </div>
        </div>
      </div>
    </Link>
  )
}

