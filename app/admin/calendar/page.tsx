import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import WorkingDaysCalendar from '@/components/WorkingDaysCalendar'

export default async function AdminCalendarPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/dashboard')

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Working Day Calendar</h1>
          <p className="mt-2 text-gray-600">
            Manage working and non-working days. Click any day to mark it as a holiday, special working day, or restore it.
          </p>
        </div>
        <WorkingDaysCalendar />
      </div>
    </Layout>
  )
}
