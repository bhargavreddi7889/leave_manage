'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Search, Key, Copy, Clock, User, Smartphone } from 'lucide-react'

const searchSchema = z.object({
  mobile: z.string()
    .min(10, 'Mobile number must be at least 10 digits')
    .max(15, 'Mobile number must not exceed 15 digits'),
})

type SearchForm = z.infer<typeof searchSchema>

interface GeneratedOTP {
  otp: string
  user: {
    id: string
    firstName: string
    lastName: string
    employeeId: string
  }
  expiresAt: string
}

export default function OTPGenerator() {
  const [isSearching, setIsSearching] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedOTP, setGeneratedOTP] = useState<GeneratedOTP | null>(null)
  const [searchedMobile, setSearchedMobile] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SearchForm>({
    resolver: zodResolver(searchSchema),
  })

  const onSearch = async (data: SearchForm) => {
    setSearchedMobile(data.mobile)
    setGeneratedOTP(null)
    toast.success('Employee found! Click "Generate OTP" to create a password reset code.')
  }

  const handleGenerateOTP = async () => {
    if (!searchedMobile) {
      toast.error('Please search for an employee first')
      return
    }

    setIsGenerating(true)
    try {
      const response = await fetch('/api/auth/generate-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mobile: searchedMobile }),
      })

      const result = await response.json()

      if (response.ok) {
        setGeneratedOTP(result)
        toast.success('OTP generated successfully!')
      } else {
        toast.error(result.error || 'Failed to generate OTP')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('OTP copied to clipboard!')
  }

  const getTimeRemaining = () => {
    if (!generatedOTP) return ''
    
    const now = new Date()
    const expires = new Date(generatedOTP.expiresAt)
    const diff = expires.getTime() - now.getTime()
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (diff <= 0) return 'Expired'
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Search Employee</h2>
        <form onSubmit={handleSubmit(onSearch)} className="space-y-4">
          <div>
            <label className="label">
              <Smartphone className="w-4 h-4 inline mr-2 text-indigo-600" />
              Mobile Number
            </label>
            <div className="flex space-x-3">
              <input
                type="tel"
                {...register('mobile')}
                className="input-field flex-1"
                placeholder="Enter employee mobile number"
              />
              <button
                type="submit"
                disabled={isSearching}
                className="btn-primary flex items-center space-x-2 disabled:opacity-50"
              >
                <Search className="w-4 h-4" />
                <span>{isSearching ? 'Searching...' : 'Search'}</span>
              </button>
            </div>
            {errors.mobile && (
              <p className="mt-1 text-sm text-red-600">{errors.mobile.message}</p>
            )}
          </div>
        </form>
      </div>

      {searchedMobile && !generatedOTP && (
        <div className="card bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Employee Found</h3>
              <p className="text-sm text-gray-600 mt-1">Mobile: {searchedMobile}</p>
            </div>
            <button
              onClick={handleGenerateOTP}
              disabled={isGenerating}
              className="btn-primary flex items-center space-x-2 disabled:opacity-50"
            >
              <Key className="w-4 h-4" />
              <span>{isGenerating ? 'Generating...' : 'Generate OTP'}</span>
            </button>
          </div>
        </div>
      )}

      {generatedOTP && (
        <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">OTP Generated</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>Expires in: {getTimeRemaining()}</span>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-green-200">
              <div className="space-y-3">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="w-4 h-4" />
                  <span>
                    {generatedOTP.user.firstName} {generatedOTP.user.lastName} ({generatedOTP.user.employeeId})
                  </span>
                </div>
                
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Smartphone className="w-4 h-4" />
                  <span>{searchedMobile}</span>
                </div>

                <div className="pt-3 border-t border-gray-200">
                  <label className="text-sm font-medium text-gray-700 block mb-2">
                    One-Time Password (OTP)
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-50 rounded-lg p-4 border-2 border-green-300">
                      <p className="text-3xl font-bold text-center tracking-widest text-gray-900">
                        {generatedOTP.otp}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(generatedOTP.otp)}
                      className="btn-secondary flex items-center space-x-2"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                      <span>Copy</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
              <p className="text-sm text-yellow-700">
                <strong>Important:</strong> Share this OTP with the employee securely. 
                The OTP is valid for 10 minutes and can only be used once.
              </p>
            </div>

            <button
              onClick={() => {
                setGeneratedOTP(null)
                setSearchedMobile('')
                reset()
              }}
              className="btn-secondary w-full"
            >
              Generate New OTP
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

