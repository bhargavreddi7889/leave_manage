import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth-config'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import OTPGenerator from '@/components/OTPGenerator'

export default async function OTPManagementPage() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">OTP Management</h1>
          <p className="mt-2 text-gray-600">
            Generate OTP for employees to reset their passwords
          </p>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>How it works:</strong> When an employee forgets their password, they will provide their mobile number. 
                Search for the employee by mobile number and generate a 6-digit OTP. Share this OTP with the employee 
                so they can complete the password reset process. OTPs expire after 10 minutes.
              </p>
            </div>
          </div>
        </div>

        <OTPGenerator />
      </div>
    </Layout>
  )
}

