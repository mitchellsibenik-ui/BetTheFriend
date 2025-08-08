'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Users } from 'lucide-react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [notificationCount, setNotificationCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [userBalance, setUserBalance] = useState<number | null>(null)

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
                <div className="ml-4 flex items-center">
                  <span className="text-gray-300 mr-2">{session?.user?.username}</span>
                  <span className="text-green-400 font-semibold mr-4">${userBalance?.toFixed(2) || '0.00'}</span>
                  <button
                    onClick={forceRefreshNotifications}
                    className="px-2 py-1 rounded-md text-xs font-medium text-gray-400 hover:bg-gray-700 hover:text-white mr-2"
                    title="Refresh Notifications"
                  >
                    🔄
                  </button>
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

          {/* Mobile: Notifications + Balance + Menu Button */}
          <div className="md:hidden flex items-center space-x-2">
            {status === 'authenticated' && (
              <>
                {/* Mobile Balance Display */}
                <span className="text-green-400 font-semibold text-sm">
                  ${userBalance?.toFixed(2) || '0.00'}
                </span>
                
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

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-gray-700">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {/* User Info at Top */}
              {status === 'authenticated' && (
                <div className="px-3 py-2 border-b border-gray-700 mb-2">
                  <div className="text-white font-medium">{session?.user?.username}</div>
                  <div className="text-green-400 text-sm">Balance: ${userBalance?.toFixed(2) || '0.00'}</div>
                </div>
              )}
              
              {/* Navigation Links */}
              <Link
                href="/sportsbook"
                className={`${
                  pathname === '/sportsbook'
                    ? 'bg-gray-800 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                } block px-3 py-2 rounded-md text-base font-medium`}
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
                } block px-3 py-2 rounded-md text-base font-medium`}
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
                } block px-3 py-2 rounded-md text-base font-medium`}
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
                } block px-3 py-2 rounded-md text-base font-medium`}
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
                } block px-3 py-2 rounded-md text-base font-medium relative`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Notifications
                {notificationCount > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
                    {notificationCount}
                  </span>
                )}
              </Link>
              
              {/* Mobile Actions */}
              {status === 'authenticated' && (
                <>
                  <button
                    onClick={() => {
                      forceRefreshNotifications()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left"
                  >
                    🔄 Refresh Notifications
                  </button>
                  <button
                    onClick={() => {
                      handleLogout()
                      setIsMobileMenuOpen(false)
                    }}
                    className="text-gray-300 hover:text-white block px-3 py-2 rounded-md text-base font-medium w-full text-left border-t border-gray-700 mt-2 pt-2"
                  >
                    Logout
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
} 