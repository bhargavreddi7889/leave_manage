'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, Settings } from 'lucide-react'

const leaveTypeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['SICK', 'VACATION', 'PERSONAL', 'MATERNITY', 'PATERNITY', 'BEREAVEMENT', 'UNPAID']),
  maxDays: z.number().min(1, 'Max days must be at least 1'),
  carryForward: z.boolean().default(false),
})

type LeaveTypeForm = z.infer<typeof leaveTypeSchema>

export default function LeaveTypeForm() {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LeaveTypeForm>({
    resolver: zodResolver(leaveTypeSchema),
    defaultValues: {
      carryForward: false,
    },
  })

  const onSubmit = async (data: LeaveTypeForm) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/leave-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Leave type created successfully!')
        reset()
        setIsOpen(false)
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to create leave type')
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
        <h2 className="text-xl font-semibold text-gray-900">Add Leave Type</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Leave Type</span>
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Name</label>
              <input {...register('name')} className="input-field" placeholder="e.g., Annual Leave" />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <label className="label">Type</label>
              <select {...register('type')} className="input-field">
                <option value="SICK">Sick Leave</option>
                <option value="VACATION">Vacation</option>
                <option value="PERSONAL">Personal</option>
                <option value="MATERNITY">Maternity</option>
                <option value="PATERNITY">Paternity</option>
                <option value="BEREAVEMENT">Bereavement</option>
                <option value="UNPAID">Unpaid</option>
              </select>
            </div>

            <div>
              <label className="label">Max Days Per Year</label>
              <input
                type="number"
                {...register('maxDays', { valueAsNumber: true })}
                className="input-field"
                min="1"
              />
              {errors.maxDays && (
                <p className="mt-1 text-sm text-red-600">{errors.maxDays.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2 pt-6">
              <input
                type="checkbox"
                {...register('carryForward')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label className="text-sm text-gray-700">Allow Carry Forward</label>
            </div>
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
              {isSubmitting ? 'Creating...' : 'Create Leave Type'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

