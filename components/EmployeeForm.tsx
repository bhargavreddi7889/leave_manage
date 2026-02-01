'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Plus, User } from 'lucide-react'

const employeeSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  employeeId: z.string().min(1, 'Employee ID is required'),
  phone: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  hodId: z.string().optional(),
  role: z.enum(['EMPLOYEE', 'HOD', 'ADMIN']),
})

type EmployeeForm = z.infer<typeof employeeSchema>

interface HOD {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  role?: string
}

export default function EmployeeForm({ hods }: { hods: HOD[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EmployeeForm>({
    resolver: zodResolver(employeeSchema),
    defaultValues: {
      role: 'EMPLOYEE',
    },
  })

  const onSubmit = async (data: EmployeeForm) => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/admin/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (response.ok) {
        toast.success('Employee created successfully!')
        reset()
        setIsOpen(false)
        window.location.reload()
      } else {
        toast.error(result.error || 'Failed to create employee')
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
        <h2 className="text-xl font-semibold text-gray-900">Add New Employee</h2>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Employee</span>
        </button>
      </div>

      {isOpen && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">First Name</label>
              <input {...register('firstName')} className="input-field" />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Last Name</label>
              <input {...register('lastName')} className="input-field" />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" {...register('email')} className="input-field" />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" {...register('password')} className="input-field" />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="label">Employee ID</label>
              <input {...register('employeeId')} className="input-field" />
              {errors.employeeId && (
                <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
              )}
            </div>

            <div>
              <label className="label">Phone</label>
              <input {...register('phone')} className="input-field" />
            </div>

            <div>
              <label className="label">Department</label>
              <input {...register('department')} className="input-field" />
            </div>

            <div>
              <label className="label">Position</label>
              <input {...register('position')} className="input-field" />
            </div>

            <div>
              <label className="label">Reporting HOD</label>
              <select {...register('hodId')} className="input-field">
                <option value="">No HOD</option>
                {hods.filter(h => h.role === 'HOD' || h.role === 'ADMIN').map((hod) => (
                  <option key={hod.id} value={hod.id}>
                    {hod.firstName} {hod.lastName} ({hod.employeeId}) - {hod.role}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">Select a HOD to assign as reporting HOD</p>
            </div>

            <div>
              <label className="label">Role</label>
              <select {...register('role')} className="input-field">
                <option value="EMPLOYEE">Employee</option>
                <option value="HOD">HOD</option>
                <option value="ADMIN">Admin</option>
              </select>
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
              {isSubmitting ? 'Creating...' : 'Create Employee'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

