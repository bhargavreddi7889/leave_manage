'use client'

import { useEffect, useState } from 'react'
import Layout from '@/components/Layout'
import TodayAtGlance from '@/components/TodayAtGlance'
import NeedsAttention from '@/components/NeedsAttention'
import LeaveSnapshot from '@/components/LeaveSnapshot'
import RecentActivity from '@/components/RecentActivity'
import AttendanceCheckInOut from '@/components/AttendanceCheckInOut'
import QuickActions from '@/components/QuickActions'

interface DashboardData {
  todayAtGlance: {
    presentToday: number
    absentToday: number
    onLeaveToday: number
    lateCheckIns: number
    missedCheckOuts: number
  }
  needsAttention: {
    pendingLeaveApprovals: number
    missedCheckOuts: number
    attendanceConflicts: number
  }
  leaveSnapshot: {
    total: number
    pending: number
    approved: number
    rejected: number
  }
  recentActivity: any[]
  adminAttendance?: any
}

export default function AdminDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('/api/admin/dashboard')
        const result = await response.json()
        if (response.ok) {
          setData(result)
        } else {
          console.error('Dashboard API error:', result.error)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 animate-pulse">
              <img 
                src="/images/logo.png" 
                alt="Rakshak Securitas Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="text-gray-500">Loading dashboard...</div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!data) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-red-500">Failed to load dashboard data</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        {/* 1. Today at a Glance */}
        <div className="w-full">
          <TodayAtGlance data={data.todayAtGlance} />
        </div>

        {/* 2. Needs Attention & 3. Leave Snapshot - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 w-full">
          <div className="min-w-0">
            <NeedsAttention data={data.needsAttention} />
          </div>
          <div className="min-w-0">
            <LeaveSnapshot data={data.leaveSnapshot} />
          </div>
        </div>

        {/* 4. Recent Activity & 5. Admin Personal Attendance & 6. Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          <div className="lg:col-span-2 min-w-0">
            <RecentActivity activities={data.recentActivity} />
          </div>
          <div className="space-y-4 md:space-y-6 min-w-0">
            <AttendanceCheckInOut />
            <QuickActions />
          </div>
        </div>
      </div>
    </Layout>
  )
}

