'use client'

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-50 via-indigo-50/30 to-purple-50/30 flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-4">
        <div className="w-32 h-32 animate-pulse">
          <img 
            src="/images/logo.png" 
            alt="Rakshak Securitas Logo" 
            className="w-full h-full object-contain"
            onError={(e) => {
              // Fallback if logo doesn't exist
              const target = e.target as HTMLImageElement
              target.style.display = 'none'
            }}
          />
        </div>
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-pink-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
        <p className="text-sm text-gray-600 font-medium">Loading...</p>
      </div>
    </div>
  )
}

