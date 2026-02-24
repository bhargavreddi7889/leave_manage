'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Clock, Save, Settings } from 'lucide-react'

const policySchema = z.object({
  officeStartTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'),
  officeEndTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format. Use HH:mm'),
})

type PolicyForm = z.infer<typeof policySchema>

interface AttendancePolicy {
  id: string
  officeStartTime: string
  officeEndTime: string
  isActive: boolean
}

export default function AttendancePolicyForm() {
  const [policy, setPolicy] = useState<AttendancePolicy | null>(null)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<PolicyForm>({
    resolver: zodResolver(policySchema),
    defaultValues: { officeStartTime: '10:00', officeEndTime: '18:00' },
  })

  useEffect(() => { fetchPolicy() }, [])

  const fetchPolicy = async () => {
    try {
      const response = await fetch('/api/admin/attendance-policy')
      const data = await response.json()
      if (response.ok) {
        setPolicy(data)
        reset({
          officeStartTime: data.officeStartTime || '10:00',
          officeEndTime: data.officeEndTime || '18:00',
        })
      }
    } catch (error) {
      console.error('Error fetching policy:', error)
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (data: PolicyForm) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/attendance-policy', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = await response.json()
      if (response.ok) {
        toast.success('Attendance policy updated successfully!')
        setPolicy(result)
      } else {
        toast.error(result.error || 'Failed to update policy')
      }
    } catch {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (loading) {
    return <div className="card"><div className="text-center py-4 text-gray-500">Loading policy...</div></div>
  }

  return (
    <div className="card">
      <div className="flex items-center mb-6">
        <Settings className="w-6 h-6 text-indigo-600 mr-3" />
        <h2 className="text-2xl font-bold text-gray-900">Attendance Settings</h2>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded">
        <p className="text-sm text-blue-700">
          <strong>Rule:</strong> Any employee who checks in within the office hours is marked{' '}
          <strong>PRESENT</strong> automatically — no minimum hours or grace period required.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="label flex items-center">
              <Clock className="w-4 h-4 mr-2 text-indigo-600" />
              Office Start Time
            </label>
            <input type="time" {...register('officeStartTime')} className="input-field" />
            {errors.officeStartTime && (
              <p className="mt-1 text-sm text-red-600">{errors.officeStartTime.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">Start of the check-in window for the day</p>
          </div>

          <div>
            <label className="label flex items-center">
              <Clock className="w-4 h-4 mr-2 text-indigo-600" />
              Office End Time
            </label>
            <input type="time" {...register('officeEndTime')} className="input-field" />
            {errors.officeEndTime && (
              <p className="mt-1 text-sm text-red-600">{errors.officeEndTime.message}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">End of the check-out window for the day</p>
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="btn-primary flex items-center space-x-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSubmitting ? 'Saving...' : 'Save Policy'}</span>
          </button>
        </div>
      </form>

      {policy && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Policy</h3>
          <div className="flex gap-6 text-sm text-gray-600">
            <div>Start Time: <span className="font-medium">{policy.officeStartTime}</span></div>
            <div>End Time: <span className="font-medium">{policy.officeEndTime}</span></div>
          </div>
        </div>
      )}
    </div>
  )
}
