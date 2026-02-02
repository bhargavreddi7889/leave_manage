import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import { findUserById } from '@/lib/db-helpers'
import ProfileForm from '@/components/ProfileForm'

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/login')
  }

  const userData = await findUserById(session.user.id)

  if (!userData) {
    redirect('/dashboard')
  }
  
  const user = {
    id: userData.id,
    firstName: userData.firstName,
    lastName: userData.lastName,
    email: userData.email,
    mobile: userData.mobile,
    employeeId: userData.employeeId,
    phone: userData.phone,
    department: userData.department,
    position: userData.position,
    role: userData.role,
    createdAt: userData.createdAt,
  }

  return (
    <Layout>
      <div className="space-y-4 md:space-y-6">
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 rounded-xl md:rounded-2xl p-4 md:p-6 lg:p-8 text-white shadow-2xl">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2">My Profile</h1>
          <p className="text-sm md:text-base text-indigo-100">View and manage your profile information</p>
        </div>

        <ProfileForm user={user} />
      </div>
    </Layout>
  )
}

