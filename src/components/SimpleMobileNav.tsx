'use client'

import { useSession } from 'next-auth/react'

export default function SimpleMobileNav() {
  const { status } = useSession()

  if (status !== 'authenticated') return null

  return (
    <div className="md:hidden bg-gray-800 border-t border-gray-700 fixed bottom-0 left-0 right-0 z-50">
      <div className="flex items-center justify-around py-3">
        <a href="/" className="flex flex-col items-center py-2 px-2 w-full text-gray-400 hover:text-white">
          <div className="text-xs font-medium">HOME</div>
        </a>
        <a href="/sportsbook" className="flex flex-col items-center py-2 px-2 w-full text-gray-400 hover:text-white">
          <div className="text-xs font-medium">SPORTS</div>
        </a>
        <a href="/showdown" className="flex flex-col items-center py-2 px-2 w-full text-gray-400 hover:text-white">
          <div className="text-xs font-medium">SHOWDOWN</div>
        </a>
        <a href="/my-bets" className="flex flex-col items-center py-2 px-2 w-full text-gray-400 hover:text-white">
          <div className="text-xs font-medium">MY BETS</div>
        </a>
        <a href="/social" className="flex flex-col items-center py-2 px-2 w-full text-gray-400 hover:text-white">
          <div className="text-xs font-medium">FRIENDS</div>
        </a>
        <a href="/notifications" className="flex flex-col items-center py-2 px-2 w-full text-gray-400 hover:text-white">
          <div className="text-xs font-medium">ALERTS</div>
        </a>
      </div>
    </div>
  )
}
