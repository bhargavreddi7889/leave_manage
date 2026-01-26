'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { X, Calendar } from 'lucide-react'
import { calculateDays } from '@/lib/utils'

const editLeaveSchema = z.object({
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

type EditLeaveForm = z.infer<typeof editLeaveSchema>

interface Leave {
  id: string
  startDate: Date
  endDate: Date
  days: number
  reason: string | null
  leaveType: {
    id: string
    name: string
  }
}

export default function EditLeaveModal({
  leave,
  onClose,
  onSuccess,
}: {
  leave: Leave
  onClose: () => void
  onSuccess: () => void
}) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EditLeaveForm>({
    resolver: zodResolver(editLeaveSchema),
    defaultValues: {
      startDate: new Date(leave.startDate).toISOString().split('T')[0],
      endDate: new Date(leave.endDate).toISOString().split('T')[0],
      reason: leave.reason || '',
    },
  })

  const startDate = watch('startDate')
  const endDate = watch('endDate')
  const days = startDate && endDate ? calculateDays(new Date(startDate), new Date(endDate)) : leave.days

  const onSubmit = async (data: EditLeaveForm) => {
    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/leaves/${leave.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Leave request updated successfully!')
        onSuccess()
      } else {
        toast.error(result.error || 'Failed to update leave request')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">Edit Leave Request</h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form className="p-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
          <div className="bg-indigo-50 p-4 rounded-xl">
            <p className="text-sm font-semibold text-indigo-900 mb-1">Leave Type</p>
            <p className="text-lg text-indigo-700">{leave.leaveType.name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startDate" className="label">
                <Calendar className="w-4 h-4 inline mr-2 text-indigo-600" />
                Start Date
              </label>
              <input
                id="startDate"
                type="date"
                {...register('startDate')}
                className="input-field"
              />
              {errors.startDate && (
                <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="endDate" className="label">
                <Calendar className="w-4 h-4 inline mr-2 text-indigo-600" />
                End Date
              </label>
              <input
                id="endDate"
                type="date"
                {...register('endDate')}
                className="input-field"
              />
              {errors.endDate && (
                <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
              )}
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl">
            <p className="text-sm text-gray-600">Total Days</p>
            <p className="text-2xl font-bold text-gray-900">{days} day(s)</p>
          </div>

          <div>
            <label htmlFor="reason" className="label">
              Reason (Optional)
            </label>
            <textarea
              id="reason"
              {...register('reason')}
              rows={4}
              className="input-field"
              placeholder="Enter reason for leave..."
            />
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary"
            >
              {isSubmitting ? 'Updating...' : 'Update Leave'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

