'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Users, 
  Clock, 
  FileText, 
  Settings, 
  BarChart3,
  Calendar,
  CalendarDays,
  User,
  Key
} from 'lucide-react'
import { useSession } from 'next-auth/react'

export default function Sidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()

  if (!session) return null

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  ]

  // Add role-specific items
  if (session.user.role !== 'ADMIN') {
    navItems.push(
      { href: session.user.role === 'HOD' ? '/hod/leaves' : '/employee/leaves', label: 'Leaves', icon: FileText },
      { href: session.user.role === 'HOD' ? '/hod/attendance' : '/employee/attendance', label: 'Attendance', icon: Clock }
    )
  }

  if (session.user.role === 'HOD') {
    navItems.push({ href: '/hod/approvals', label: 'Approvals', icon: FileText })
  }

  if (session.user.role === 'ADMIN') {
    navItems.push(
      { href: '/admin/employees', label: 'Employees', icon: Users },
      { href: '/admin/attendance', label: 'Attendance', icon: Clock },
      { href: '/admin/approvals', label: 'Leaves', icon: FileText },
      { href: '/admin/policies', label: 'Policies', icon: Settings },
      { href: '/admin/calendar', label: 'Work Calendar', icon: CalendarDays },
      { href: '/admin/otp-management', label: 'OTP Management', icon: Key },
      { href: '/admin/my-attendance', label: 'My Attendance', icon: Calendar }
    )
  }

  // Add Reports for all roles
  navItems.push({ href: '/reports', label: 'Reports', icon: BarChart3 })
  
  // Add Profile for all roles
  navItems.push({ href: '/profile', label: 'Profile', icon: User })

  return (
    <aside className="hidden lg:block w-64 bg-white border-r border-gray-200 h-screen fixed left-0 top-0 overflow-y-auto z-50 custom-scrollbar">
      <div className="p-4 pb-8">
        {/* Navbar Pic */}
        <div className="mb-6 pt-4 flex items-center justify-center">
          <div className="w-full px-2">
            <img 
              src="/images/navbarpic.png" 
              alt="Rakshak Securitas" 
              className="w-full h-auto object-contain"
              onError={(e) => {
                // Fallback if image doesn't exist
                const target = e.target as HTMLImageElement
                target.style.display = 'none'
              }}
            />
          </div>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-indigo-50 text-indigo-700 border-l-4 border-indigo-600'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

