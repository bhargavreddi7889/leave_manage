'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Calendar, Plus } from 'lucide-react'
import { calculateDays } from '@/lib/utils'

const leaveSchema = z.object({
  leaveTypeId: z.string().min(1, 'Leave type is required'),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  reason: z.string().optional(),
}).refine((data) => {
  const start = new Date(data.startDate)
  const end = new Date(data.endDate)
  return end >= start
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
})

type LeaveForm = z.infer<typeof leaveSchema>

interface LeaveType {
  id: string
  name: string
  type: string
  maxDays: number
}

interface Balance {
  leaveType: {
    id: string
  }
  balance: number
}

export default function LeaveApplicationForm({ 
  leaveTypes, 
  balances,
  hasManager = true
}: { 
  leaveTypes: LeaveType[]
  balances: Balance[]
  hasManager?: boolean
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<LeaveForm>({
    resolver: zodResolver(leaveSchema),
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const leaveTypeId = watch('leaveTypeId')

  const selectedBalance = balances.find(b => b.leaveType.id === leaveTypeId)
  const days = startDate && endDate ? calculateDays(new Date(startDate), new Date(endDate)) : 0

  const onSubmit = async (data: LeaveForm) => {
    if (!hasManager) {
      toast.error('You cannot apply for leave until a reporting manager is assigned. Please contact your administrator.')
      return
    }

    if (selectedBalance && days > selectedBalance.balance) {
      toast.error(`Insufficient leave balance. Available: ${selectedBalance.balance} days`)
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch('/api/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          days,
        }),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Leave request submitted successfully!')
        reset()
        setIsOpen(false)
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } else {
        toast.error(result.error || 'Failed to submit leave request')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="card">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">Apply for Leave</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={!hasManager}
          className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-4 h-4" />
          <span>New Request</span>
        </button>
      </div>

      {isOpen && hasManager && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Leave Type</label>
              <select {...register('leaveTypeId')} className="input-field">
                <option value="">Select leave type</option>
                {leaveTypes.map((type) => {
                  const balance = balances.find(b => b.leaveType.id === type.id)
                  return (
                    <option key={type.id} value={type.id}>
                      {type.name} {balance && `(${balance.balance} days available)`}
                    </option>
                  )
                })}
              </select>
              {errors.leaveTypeId && (
                <p className="mt-1 text-sm text-red-600">{errors.leaveTypeId.message}</p>
              )}
            </div>

            <div>
              <label className="label">Available Balance</label>
              <div className="input-field bg-gray-50">
                {selectedBalance ? (
                  <span className="text-gray-700">{selectedBalance.balance} days</span>
                ) : (
                  <span className="text-gray-400">Select leave type</span>
                )}
              </div>
            </div>

            <div>
              <label className="label">Start Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('startDate')}
                  className="input-field pl-10"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label className="label">End Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="date"
                  {...register('endDate')}
                  className="input-field pl-10"
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          {startDate && endDate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Total Days:</strong> {days} day(s)
                {selectedBalance && days > selectedBalance.balance && (
                  <span className="text-red-600 ml-2">
                    (Insufficient balance: {selectedBalance.balance} days available)
                  </span>
                )}
              </p>
            </div>
          )}

          <div>
            <label className="label">Reason (Optional)</label>
            <textarea
              {...register('reason')}
              className="input-field"
              rows={3}
              placeholder="Enter reason for leave..."
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                reset()
              }}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

