'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Smartphone, Lock, Eye, EyeOff, ArrowLeft, Key } from 'lucide-react'

const mobileSchema = z.object({
  mobile: z.string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits'),
})

const otpSchema = z.object({
  otp: z.string().length(6, 'OTP must be 6 digits'),
})

const passwordSchema = z.object({
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string().min(6, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type MobileForm = z.infer<typeof mobileSchema>
type OTPForm = z.infer<typeof otpSchema>
type PasswordForm = z.infer<typeof passwordSchema>

type Step = 'mobile' | 'otp' | 'password' | 'success'

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('mobile')
  const [mobile, setMobile] = useState('')
  const [userId, setUserId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const mobileForm = useForm<MobileForm>({
    resolver: zodResolver(mobileSchema),
  })

  const otpForm = useForm<OTPForm>({
    resolver: zodResolver(otpSchema),
  })

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  })

  const onSubmitMobile = async (data: MobileForm) => {
    setIsLoading(true)
    setMobile(data.mobile)
    
    // In a real application, this would trigger an SMS to the user
    // For now, we just move to OTP step and admin will generate OTP
    toast.success('Please contact your administrator to get the OTP for password reset.')
    setStep('otp')
    setIsLoading(false)
  }

  const onSubmitOTP = async (data: OTPForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mobile,
          otp: data.otp,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('OTP verified successfully!')
        setUserId(result.userId)
        setStep('password')
      } else {
        toast.error(result.error || 'Invalid OTP')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const onSubmitPassword = async (data: PasswordForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          newPassword: data.newPassword,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Password reset successfully!')
        setStep('success')
      } else {
        toast.error(result.error || 'Failed to reset password')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <img 
              src="/images/navbarpic.png" 
              alt="Rakshak Securitas" 
              className="h-20 w-auto object-contain"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Reset Password</h2>
          <p className="mt-2 text-gray-600">
            {step === 'mobile' && 'Enter your mobile number'}
            {step === 'otp' && 'Enter the OTP from your administrator'}
            {step === 'password' && 'Create a new password'}
            {step === 'success' && 'Password reset successful!'}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          {step === 'mobile' && (
            <form className="space-y-6" onSubmit={mobileForm.handleSubmit(onSubmitMobile)}>
              <div>
                <label htmlFor="mobile" className="label">
                  <Smartphone className="w-4 h-4 inline mr-2 text-indigo-600" />
                  Mobile Number
                </label>
                <input
                  id="mobile"
                  type="tel"
                  {...mobileForm.register('mobile')}
                  className="input-field"
                  placeholder="Enter your mobile number"
                />
                {mobileForm.formState.errors.mobile && (
                  <p className="mt-1 text-sm text-red-600">
                    {mobileForm.formState.errors.mobile.message}
                  </p>
                )}
              </div>

              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> After submitting, contact your administrator to generate an OTP for password reset.
                </p>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                <span>{isLoading ? 'Processing...' : 'Continue'}</span>
              </button>
            </form>
          )}

          {step === 'otp' && (
            <form className="space-y-6" onSubmit={otpForm.handleSubmit(onSubmitOTP)}>
              <div>
                <label htmlFor="otp" className="label">
                  <Key className="w-4 h-4 inline mr-2 text-indigo-600" />
                  Enter OTP
                </label>
                <input
                  id="otp"
                  type="text"
                  maxLength={6}
                  {...otpForm.register('otp')}
                  className="input-field text-center text-2xl tracking-widest"
                  placeholder="000000"
                />
                {otpForm.formState.errors.otp && (
                  <p className="mt-1 text-sm text-red-600">
                    {otpForm.formState.errors.otp.message}
                  </p>
                )}
                <p className="mt-2 text-sm text-gray-500">
                  Mobile: {mobile}
                </p>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                <p className="text-sm text-yellow-700">
                  <strong>OTP expires in 10 minutes.</strong> If you haven't received it, contact your administrator.
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => setStep('mobile')}
                  className="flex-1 btn-secondary"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {isLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>
            </form>
          )}

          {step === 'password' && (
            <form className="space-y-6" onSubmit={passwordForm.handleSubmit(onSubmitPassword)}>
              <div>
                <label htmlFor="newPassword" className="label">
                  <Lock className="w-4 h-4 inline mr-2 text-indigo-600" />
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    {...passwordForm.register('newPassword')}
                    className="input-field pr-10"
                    placeholder="Enter new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="label">
                  <Lock className="w-4 h-4 inline mr-2 text-indigo-600" />
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    {...passwordForm.register('confirmPassword')}
                    className="input-field pr-10"
                    placeholder="Confirm new password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">
                    {passwordForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full btn-primary disabled:opacity-50"
              >
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="text-center space-y-6">
              <div className="flex justify-center">
                <div className="rounded-full bg-green-100 p-3">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Password Reset Successful!</h3>
                <p className="mt-2 text-gray-600">
                  You can now login with your new password.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-block w-full btn-primary"
              >
                Go to Login
              </Link>
            </div>
          )}

          {step !== 'success' && (
            <div className="mt-6 text-center">
              <Link href="/login" className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center justify-center space-x-1">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

