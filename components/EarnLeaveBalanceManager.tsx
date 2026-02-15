'use client'

import { useState } from 'react'
import { Calendar, Save, X, Edit2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Employee {
  id: string
  firstName: string
  lastName: string
  employeeId: string
  oldEarnLeaveBalance?: number
}

interface EarnLeaveBalanceManagerProps {
  employee: Employee
  onUpdate?: () => void
}

export default function EarnLeaveBalanceManager({ employee, onUpdate }: EarnLeaveBalanceManagerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [balance, setBalance] = useState(employee.oldEarnLeaveBalance || 0)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (balance < 0) {
      toast.error('Balance cannot be negative')
      return
    }

    setSaving(true)
    try {
      const response = await fetch('/api/admin/earn-leave-balance', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: employee.id,
          oldEarnLeaveBalance: balance,
        }),
      })

      if (response.ok) {
        toast.success('Old Earn Leave balance updated successfully')
        setIsEditing(false)
        if (onUpdate) {
          onUpdate()
        }
      } else {
        const result = await response.json()
        toast.error(result.error || 'Failed to update balance')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setBalance(employee.oldEarnLeaveBalance || 0)
    setIsEditing(false)
  }

  return (
    <div className="flex items-center space-x-2">
      {isEditing ? (
        <>
          <input
            type="number"
            min="0"
            step="0.5"
            value={balance}
            onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
            className="w-24 text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            placeholder="0"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
            title="Save"
          >
            <Save className="w-4 h-4" />
          </button>
          <button
            onClick={handleCancel}
            disabled={saving}
            className="p-1 text-red-600 hover:text-red-700 disabled:opacity-50"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </>
      ) : (
        <>
          <span className="text-sm text-gray-700 font-medium">
            {employee.oldEarnLeaveBalance || 0} EL
          </span>
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 text-indigo-600 hover:text-indigo-700"
            title="Edit Old Earn Leave Balance"
          >
            <Edit2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  )
}

