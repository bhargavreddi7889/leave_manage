'use client'

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
  User
} from 'lucide-react'

export default function Navbar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  // Determine the correct "My Leaves" link based on role (not for admin)
  const myLeavesLink = session.user.role === 'MANAGER' ? '/manager/leaves' : '/employee/leaves'

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/profile', label: 'Profile', icon: User },
  ]

  // Add "My Leaves" only for non-admin users
  if (session.user.role !== 'ADMIN') {
    navItems.splice(1, 0, { href: myLeavesLink, label: 'My Leaves', icon: Calendar })
  }

  if (session.user.role === 'MANAGER') {
    navItems.push({ href: '/manager/approvals', label: 'Approvals', icon: FileText })
  }

  if (session.user.role === 'ADMIN') {
    navItems.push(
      { href: '/admin/approvals', label: 'View Leaves', icon: FileText },
      { href: '/admin/employees', label: 'Employees', icon: Users },
      { href: '/admin/policies', label: 'Policies', icon: Settings }
    )
  }

  return (
    <nav className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-primary-600">Rakshak Securitas</h1>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {item.label}
                  </Link>
                )
              })}
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-gray-700">
              <User className="w-4 h-4" />
              <span className="font-medium">{session.user.name}</span>
              <span className="text-gray-500">({session.user.role})</span>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: '/login' })}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}

