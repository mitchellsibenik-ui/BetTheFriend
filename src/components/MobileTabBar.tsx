'use client'

import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'

export default function MobileTabBar() {
  const { status } = useSession()
  const pathname = usePathname()

  // Simple, direct navigation - no state, no polling, no effects
  const navigateTo = (path: string) => {
    console.log(`Navigating to: ${path}`)
    // Direct navigation - no state management, no cleanup needed
    window.location.href = path
  }

  if (status !== 'authenticated') return null

  return (
    <div className="md:hidden bg-gray-800 border-t border-gray-700 fixed bottom-0 left-0 right-0 z-[9999]">
      <div className="flex items-center justify-around py-3">
        <button
          className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors w-full ${
            pathname === '/'
              ? 'text-blue-400 bg-blue-900/20'
              : 'text-gray-400 hover:text-white active:bg-gray-700'
          }`}
          onClick={() => navigateTo('/')}
          onTouchStart={() => {}} // Prevent touch delay
        >
          <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </button>
        
        <button
          className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors w-full ${
            pathname === '/sportsbook'
              ? 'text-blue-400 bg-blue-900/20'
              : 'text-gray-400 hover:text-white active:bg-gray-700'
          }`}
          onClick={() => navigateTo('/sportsbook')}
          onTouchStart={() => {}}
        >
          <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-xs font-medium">Sports</span>
        </button>
        
        <button
          className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors w-full ${
            pathname === '/showdown'
              ? 'text-blue-400 bg-blue-900/20'
              : 'text-gray-400 hover:text-white active:bg-gray-700'
          }`}
          onClick={() => navigateTo('/showdown')}
          onTouchStart={() => {}}
        >
          <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span className="text-xs font-medium">Showdown</span>
        </button>
        
        <button
          className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors w-full ${
            pathname === '/my-bets'
              ? 'text-blue-400 bg-blue-900/20'
              : 'text-gray-400 hover:text-white active:bg-gray-700'
          }`}
          onClick={() => navigateTo('/my-bets')}
          onTouchStart={() => {}}
        >
          <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <span className="text-xs font-medium">My Bets</span>
        </button>
        
        <button
          className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors w-full ${
            pathname === '/social'
              ? 'text-blue-400 bg-blue-900/20'
              : 'text-gray-400 hover:text-white active:bg-gray-700'
          }`}
          onClick={() => navigateTo('/social')}
          onTouchStart={() => {}}
        >
          <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-xs font-medium">Friends</span>
        </button>
        
              <button
                className={`flex flex-col items-center py-2 px-2 rounded-lg transition-colors w-full ${
                  pathname === '/notifications'
                    ? 'text-blue-400 bg-blue-900/20'
                    : 'text-gray-400 hover:text-white active:bg-gray-700'
                }`}
                onClick={() => navigateTo('/notifications')}
                onTouchStart={() => {}}
              >
                <svg className="h-6 w-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-xs font-medium">Alerts</span>
              </button>
      </div>
    </div>
  )
}
