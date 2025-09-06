'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'

export default function Navigation() {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  if (status === 'loading') {
    return (
      <nav className="bg-gray-800 h-16 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </nav>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <nav className="bg-gray-900">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="text-white font-bold text-xl">
            BetTheFriend
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-8">
            <Link
              href="/sportsbook"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/sportsbook'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Sportsbook
            </Link>
            <Link
              href="/showdown"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/showdown'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Showdown
            </Link>
            <Link
              href="/my-bets"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/my-bets'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              My Bets
            </Link>
            <Link
              href="/social"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/social'
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:text-white'
              }`}
            >
              Friends
            </Link>
          </div>

          {/* User Info */}
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">{session?.user?.username}</span>
            <button
              onClick={() => signOut({ callbackUrl: '/' })}
              className="px-3 py-2 rounded-md text-sm font-medium text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              Logout
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden bg-gray-800 border-t border-gray-700 fixed bottom-0 left-0 right-0 z-50">
          <div className="flex justify-around py-3">
            <Link href="/" className="text-gray-400 hover:text-white text-xs">
              HOME
            </Link>
            <Link href="/sportsbook" className="text-gray-400 hover:text-white text-xs">
              SPORTS
            </Link>
            <Link href="/showdown" className="text-gray-400 hover:text-white text-xs">
              SHOWDOWN
            </Link>
            <Link href="/my-bets" className="text-gray-400 hover:text-white text-xs">
              MY BETS
            </Link>
            <Link href="/social" className="text-gray-400 hover:text-white text-xs">
              FRIENDS
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}