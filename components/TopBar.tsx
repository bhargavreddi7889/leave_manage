'use client'

import { useSession, signOut } from 'next-auth/react'
import { User, LogOut } from 'lucide-react'

export default function TopBar() {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <header className="h-16 bg-white border-b border-gray-200 fixed top-0 left-0 lg:left-64 right-0 z-50 flex items-center justify-between px-4 lg:px-6 shadow-sm">
      <div className="flex items-center">
        <h1 className="text-xl lg:text-2xl font-bold text-indigo-600">Rakshak Securitas</h1>
      </div>
      
      <div className="flex items-center space-x-2 lg:space-x-4">
        <div className="hidden md:flex items-center space-x-2 text-sm text-gray-700">
          <User className="w-4 h-4" />
          <span className="font-medium">{session.user.name}</span>
          <span className="text-gray-500 hidden lg:inline">({session.user.role})</span>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors px-2 lg:px-3 py-2 rounded-lg hover:bg-gray-50"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  )
}

