'use client'

import { useState, useEffect } from 'react'
import { Power, PowerOff, CheckCircle, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AttendanceControlToggle() {
  const [isEnabled, setIsEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/admin/attendance-control')
      const data = await response.json()
      if (response.ok) {
        setIsEnabled(data.isEnabled || false)
      }
    } catch (error) {
      console.error('Error fetching attendance control status:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async () => {
    if (toggling) return

    setToggling(true)
    try {
      const response = await fetch('/api/admin/attendance-control', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !isEnabled }),
      })

      const result = await response.json()

      if (response.ok) {
        setIsEnabled(!isEnabled)
        toast.success(result.message || `Attendance system ${!isEnabled ? 'enabled' : 'disabled'}`)
      } else {
        toast.error(result.error || 'Failed to update attendance control')
      }
    } catch (error) {
      toast.error('An error occurred. Please try again.')
    } finally {
      setToggling(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 shadow-lg">
        <div className="text-center py-4 text-white">Loading attendance control...</div>
      </div>
    )
  }

  return (
    <div className={`rounded-xl p-6 shadow-lg transition-all duration-300 ${
      isEnabled 
        ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
        : 'bg-gradient-to-r from-gray-500 to-gray-600'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            {isEnabled ? (
              <CheckCircle className="w-8 h-8 text-white" />
            ) : (
              <XCircle className="w-8 h-8 text-white" />
            )}
            <h3 className="text-2xl font-bold text-white">Attendance System</h3>
          </div>
          <p className="text-white/90 text-sm">
            {isEnabled 
              ? '✓ Check-in/out is currently ENABLED for all users'
              : '⚠ Check-in/out is currently DISABLED'}
          </p>
        </div>
        
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`relative inline-flex h-14 w-28 items-center rounded-full shadow-lg transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-white/50 hover:scale-105 ${
            isEnabled 
              ? 'bg-white hover:shadow-xl' 
              : 'bg-white/20 hover:bg-white/30'
          } ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <span
            className={`inline-block h-10 w-10 transform rounded-full transition-all duration-300 shadow-md ${
              isEnabled 
                ? 'translate-x-16 bg-green-500' 
                : 'translate-x-2 bg-gray-400'
            }`}
          >
            <div className="flex items-center justify-center h-full">
              {isEnabled ? (
                <Power className="w-5 h-5 text-white" />
              ) : (
                <PowerOff className="w-5 h-5 text-white" />
              )}
            </div>
          </span>
          <span className={`absolute text-xs font-bold transition-opacity duration-300 ${
            isEnabled ? 'left-3 text-green-600 opacity-100' : 'left-3 text-white/60 opacity-0'
          }`}>
            ON
          </span>
          <span className={`absolute text-xs font-bold transition-opacity duration-300 ${
            !isEnabled ? 'right-3 text-white opacity-100' : 'right-3 text-white/60 opacity-0'
          }`}>
            OFF
          </span>
        </button>
      </div>

      {isEnabled && (
        <div className="mt-4 p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-white" />
            <p className="text-sm font-medium text-white">
              All users can now check in and check out normally
            </p>
          </div>
        </div>
      )}
      
      {!isEnabled && (
        <div className="mt-4 p-4 bg-white/20 backdrop-blur-sm border border-white/30 rounded-lg">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-white" />
            <p className="text-sm font-medium text-white">
              Users cannot mark attendance until you enable the system
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

