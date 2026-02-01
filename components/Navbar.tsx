'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Settings, 
  FileText, 
  LogOut,
  User,
  Menu,
  X
} from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  if (!session) return null

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  // Determine the correct "My Leaves" link based on role (not for admin)
  const myLeavesLink = session.user.role === 'HOD' ? '/hod/leaves' : '/employee/leaves'

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  // Add "My Leaves" and "Attendance" for non-admin users
  if (session.user.role !== 'ADMIN') {
    navItems.splice(1, 0, { href: myLeavesLink, label: 'My Leaves', icon: Calendar })
    const attendanceLink = session.user.role === 'HOD' ? '/hod/attendance' : '/employee/attendance'
    navItems.splice(2, 0, { href: attendanceLink, label: 'Attendance', icon: Calendar })
  }

  if (session.user.role === 'HOD') {
    navItems.push({ href: '/hod/approvals', label: 'Approvals', icon: FileText })
  }

  if (session.user.role === 'ADMIN') {
    navItems.push(
      { href: '/admin/approvals', label: 'View Leaves', icon: FileText },
      { href: '/admin/employees', label: 'Employees', icon: Users },
      { href: '/admin/policies', label: 'Policies', icon: Settings },
      { href: '/admin/attendance', label: 'Manage Attendance', icon: Calendar },
      { href: '/admin/my-attendance', label: 'My Attendance', icon: Calendar }
    )
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <h1 className="text-xl md:text-2xl font-bold text-indigo-600">Rakshak Securitas</h1>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex lg:items-center lg:flex-1 lg:justify-center lg:ml-4">
            <div className="flex items-center space-x-1 overflow-x-auto scrollbar-hide">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-2 py-2 border-b-2 text-xs md:text-sm font-medium transition-colors whitespace-nowrap ${
                      isActive(item.href)
                        ? 'border-indigo-500 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-1 md:mr-2 flex-shrink-0" />
                    <span className="hidden md:inline">{item.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* User info and logout - Desktop */}
          <div className="hidden lg:flex lg:items-center lg:space-x-4 lg:ml-4">
            <div className="flex items-center space-x-2 text-xs md:text-sm text-gray-700">
              <User className="w-4 h-4" />
              <span className="font-medium hidden xl:inline">{session.user.name}</span>
              <span className="text-gray-500 hidden xl:inline">({session.user.role})</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 transition-colors text-xs md:text-sm"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden md:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-gray-200">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center px-3 py-2 rounded-md text-base font-medium ${
                      isActive(item.href)
                        ? 'bg-indigo-50 text-indigo-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    {item.label}
                  </Link>
                )
              })}
              <div className="border-t border-gray-200 pt-2 mt-2">
                <div className="flex items-center px-3 py-2 text-sm text-gray-700">
                  <User className="w-5 h-5 mr-3" />
                  <span className="font-medium">{session.user.name}</span>
                  <span className="text-gray-500 ml-2">({session.user.role})</span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/login' })}
                  className="flex items-center w-full px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                >
                  <LogOut className="w-5 h-5 mr-3" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}

