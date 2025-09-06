'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Users, ArrowLeft } from 'lucide-react'
import BalanceDisplay from './BalanceDisplay'

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const router = useRouter()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [userBalance, setUserBalance] = useState<number | null>(null)

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isMobileMenuOpen])

  // Handle escape key to close mobile menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMobileMenuOpen) {
        setIsMobileMenuOpen(false)
      }
    }

    if (isMobileMenuOpen) {
      document.addEventListener('keydown', handleEscape)
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isMobileMenuOpen])

  const fetchNotificationCount = async () => {
    if (status !== 'authenticated') return

    try {
      const response = await fetch('/api/notifications', {
        cache: 'no-store', // Prevent caching
        headers: {
          'Cache-Control': 'no-cache'
        }
      })
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      const unreadCount = data.notifications.filter((n: any) => !n.read).length
      console.log('Updated notification count:', unreadCount)
      setNotificationCount(unreadCount)
      
      // Store in localStorage to prevent stale data
      localStorage.setItem('notificationCount', unreadCount.toString())
    } catch (error) {
      console.error('Error fetching notification count:', error)
      setNotificationCount(0)
      localStorage.removeItem('notificationCount')
    } finally {
      setIsLoading(false)
    }
  }

  const forceRefreshNotifications = async () => {
    console.log('Force refreshing notifications...')
    // Clear any cached data
    localStorage.removeItem('notificationCount')
    setNotificationCount(0)
    await fetchNotificationCount()
  }

  const fetchUserBalance = async () => {
    if (status !== 'authenticated') return

    try {
      const response = await fetch('/api/user/balance')
      if (response.ok) {
        const data = await response.json()
        console.log('Updated user balance:', data.balance)
        setUserBalance(data.balance)
      }
    } catch (error) {
      console.error('Error fetching user balance:', error)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      // Clear any stale cached data on mount
      localStorage.removeItem('notificationCount')
      fetchNotificationCount()
      fetchUserBalance()
      const interval = setInterval(() => {
        fetchNotificationCount()
        fetchUserBalance()
      }, 30000)
      return () => clearInterval(interval)
    } else {
      setNotificationCount(0)
      setUserBalance(null)
      setIsLoading(false)
      localStorage.removeItem('notificationCount')
    }
  }, [status])

  useEffect(() => {
    const handleBetAccepted = () => {
      fetchNotificationCount()
    }
    window.addEventListener('betAccepted', handleBetAccepted)
    return () => {
      window.removeEventListener('betAccepted', handleBetAccepted)
    }
  }, [])

  useEffect(() => {
    const handleNotificationUpdate = () => {
      console.log('Notification update event received')
      forceRefreshNotifications()
    }
    window.addEventListener('notificationUpdate', handleNotificationUpdate)
    return () => {
      window.removeEventListener('notificationUpdate', handleNotificationUpdate)
    }
  }, [status]) // Add status as dependency

  useEffect(() => {
    const handleBalanceUpdate = () => {
      console.log('Balance update event triggered')
      fetchUserBalance()
    }
    window.addEventListener('balanceUpdate', handleBalanceUpdate)
    return () => {
      window.removeEventListener('balanceUpdate', handleBalanceUpdate)
    }
  }, [status]) // Add status as dependency

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  // Check if we should show the back button (not on home page)
  const shouldShowBackButton = pathname !== '/' && pathname !== '/sportsbook'

  if (status === 'loading' || isLoading) {
    return (
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 font-bold text-xl hover:from-blue-500 hover:to-purple-600 transition-all duration-300">
                BetTheFriend
              </Link>
            </div>
          </div>
        </div>
      </nav>
    )
  }

  // Don't show navigation for unauthenticated users
  if (status === 'unauthenticated') {
    return null
  }

  return (
    <nav className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-white font-bold text-lg sm:text-xl">
              BetTheFriend
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                <Link
                  href="/sportsbook"
                className={`${
                    pathname === '/sportsbook'
                    ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } px-3 py-2 rounded-md text-sm font-medium`}
                >
                  Sportsbook
                </Link>
                <Link
                href="/showdown"
                className={`${
                  pathname === '/showdown'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } px-3 py-2 rounded-md text-sm font-medium`}
              >
                Showdown
                </Link>
                <Link
                  href="/my-bets"
                className={`${
                    pathname === '/my-bets'
                    ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } px-3 py-2 rounded-md text-sm font-medium`}
                >
                  My Bets
                </Link>
              <Link
                href="/social"
                className={`${
                  pathname === '/social'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } px-3 py-2 rounded-md text-sm font-medium`}
              >
                Friends
              </Link>
              </div>
          </div>

          {/* Desktop User Info */}
          <div className="hidden md:flex items-center">
            {status === 'authenticated' && (
              <>
                <Link
                  href="/notifications"
                  className="relative p-2 text-gray-300 hover:text-white"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </Link>
                <div className="ml-4 flex items-center gap-4">
                  <span className="text-gray-300">{session?.user?.username}</span>
                  <BalanceDisplay 
                    balance={userBalance || 0} 
                    showPaymentButtons={false}
                    onBalanceUpdate={setUserBalance}
                  />
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Mobile: Back Button + Notifications + Balance + Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {/* Mobile Back Button */}
            {shouldShowBackButton && (
              <button
                onClick={handleBack}
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
                title="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            
            {status === 'authenticated' && (
              <>
                {/* Mobile Balance Display */}
                <BalanceDisplay 
                  balance={userBalance || 0} 
                  showPaymentButtons={false}
                  onBalanceUpdate={setUserBalance}
                />
                
                {/* Mobile Notifications */}
                <Link
                  href="/notifications"
                  className="relative p-1"
                >
                  <svg
                    className="h-5 w-5 text-gray-300"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                    />
                  </svg>
                  {notificationCount > 0 && (
                    <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </Link>
              </>
            )}
            
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <svg
                  className="block h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              ) : (
                <svg
                  className="block h-5 w-5"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Tab Bar - Direct Navigation */}
        {status === 'authenticated' && (
          <div className="md:hidden bg-gray-800 border-t border-gray-700">
            <div className="flex items-center justify-around py-2">
              <Link
                href="/sportsbook"
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                  pathname === '/sportsbook'
                    ? 'text-blue-400 bg-blue-900/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-xs font-medium">Sports</span>
              </Link>
              
              <Link
                href="/showdown"
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                  pathname === '/showdown'
                    ? 'text-blue-400 bg-blue-900/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-xs font-medium">Showdown</span>
              </Link>
              
              <Link
                href="/my-bets"
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                  pathname === '/my-bets'
                    ? 'text-blue-400 bg-blue-900/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span className="text-xs font-medium">My Bets</span>
              </Link>
              
              <Link
                href="/social"
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 ${
                  pathname === '/social'
                    ? 'text-blue-400 bg-blue-900/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                <span className="text-xs font-medium">Friends</span>
              </Link>
              
              <Link
                href="/notifications"
                className={`flex flex-col items-center py-2 px-3 rounded-lg transition-colors duration-200 relative ${
                  pathname === '/notifications'
                    ? 'text-blue-400 bg-blue-900/20'
                    : 'text-gray-400 hover:text-white hover:bg-gray-700'
                }`}
              >
                <svg className="h-5 w-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="text-xs font-medium">Alerts</span>
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        )}

        {/* Mobile Menu - Full Screen Overlay */}
        {isMobileMenuOpen && (
          <div 
            className="md:hidden fixed inset-0 z-50 bg-gray-900"
            onClick={(e) => {
              // Close menu when clicking on backdrop
              if (e.target === e.currentTarget) {
                setIsMobileMenuOpen(false)
              }
            }}
          >
            <div className="flex flex-col h-full">
              {/* Header with close button */}
              <div className="flex items-center justify-between p-4 border-b border-gray-700">
                <div className="text-white font-bold text-lg">Menu</div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700"
                >
                  <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Menu Content */}
              <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
                {/* User Info at Top */}
                {status === 'authenticated' && (
                  <div className="px-3 py-4 border-b border-gray-700 mb-4">
                    <div className="text-white font-medium text-lg">{session?.user?.username}</div>
                    <div className="text-green-400 text-base">Balance: ${userBalance?.toFixed(2) || '0.00'}</div>
                  </div>
                )}
                
                {/* Navigation Links */}
                <Link
                  href="/sportsbook"
                  className={`${
                    pathname === '/sportsbook'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } block px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sportsbook
                </Link>
                <Link
                  href="/showdown"
                  className={`${
                    pathname === '/showdown'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } block px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Showdown
                </Link>
                <Link
                  href="/my-bets"
                  className={`${
                    pathname === '/my-bets'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } block px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  My Bets
                </Link>
                <Link
                  href="/social"
                  className={`${
                    pathname === '/social'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } block px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Friends
                </Link>
                <Link
                  href="/notifications"
                  className={`${
                    pathname === '/notifications'
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } block px-4 py-3 rounded-lg text-lg font-medium transition-colors duration-200 relative`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Notifications
                  {notificationCount > 0 && (
                    <span className="ml-3 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                      {notificationCount}
                    </span>
                  )}
                </Link>
                
                {/* Mobile Actions */}
                {status === 'authenticated' && (
                  <div className="mt-8 pt-4 border-t border-gray-700">
                    <button
                      onClick={() => {
                        handleLogout()
                        setIsMobileMenuOpen(false)
                      }}
                      className="text-gray-300 hover:text-white block px-4 py-3 rounded-lg text-lg font-medium w-full text-left transition-colors duration-200"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 