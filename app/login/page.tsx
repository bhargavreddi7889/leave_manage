'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { LogIn, Lock, Mail } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        toast.error('Invalid email or password')
      } else if (result?.ok) {
        toast.success('Login successful!')
        // Wait a moment for cookie to be set, then redirect
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 100)
      } else {
        toast.error('Login failed. Please try again.')
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
                // Fallback if image doesn't exist
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
          <h2 className="text-2xl font-semibold text-gray-800">Leave Management System</h2>
          <p className="mt-2 text-gray-600">Sign in to your account</p>
        </div>
        <div className="bg-white rounded-2xl shadow-2xl p-8 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
            <div>
              <label htmlFor="email" className="label">
                <Mail className="w-4 h-4 inline mr-2 text-indigo-600" />
                Email Address
              </label>
              <input
                id="email"
                type="email"
                {...register('email')}
                className="input-field"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="password" className="label">
                <Lock className="w-4 h-4 inline mr-2 text-indigo-600" />
                Password
              </label>
              <input
                id="password"
                type="password"
                {...register('password')}
                className="input-field"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white px-4 py-3 rounded-xl hover:from-indigo-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-200 font-semibold flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              <LogIn className="w-5 h-5" />
              <span>{isLoading ? 'Signing in...' : 'Sign In'}</span>
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link href="/signup" className="font-semibold text-indigo-600 hover:text-indigo-700">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

