'use client'

import { SessionProvider } from 'next-auth/react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider
      refetchInterval={0}
      refetchOnWindowFocus={false}
    >
      <div className="min-h-screen bg-gray-50 flex">
        <Sidebar />
        <div className="flex-1 lg:ml-64 flex flex-col min-w-0">
          <TopBar />
          <main className="flex-1 mt-16 p-6 lg:p-8 overflow-y-auto smooth-scroll">
            <div className="max-w-full mx-auto">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}

