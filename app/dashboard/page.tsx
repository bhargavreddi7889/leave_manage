import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  // Redirect to role-specific dashboard
  if (session.user.role === 'ADMIN') {
    redirect('/admin/dashboard')
  } else if (session.user.role === 'MANAGER') {
    redirect('/manager/dashboard')
  } else {
    redirect('/employee/dashboard')
  }
}
