import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || !session.user) {
    redirect('/login?error=SessionExpired')
  }

  // Redirect to role-specific dashboard
  const userRole = session.user.role
  
  if (userRole === 'ADMIN') {
    redirect('/admin/dashboard')
  } else if (userRole === 'HOD') {
    redirect('/hod/dashboard')
  } else {
    redirect('/employee/dashboard')
  }
}
