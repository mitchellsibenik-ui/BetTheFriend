'use client'

import { useSession } from 'next-auth/react'
import { useEffect } from 'react'

export default function SimpleMobileNav() {
  const { status } = useSession()

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return

    // Remove any existing mobile nav
    const existing = document.getElementById('simple-mobile-nav')
    if (existing) {
      existing.remove()
    }

    // Create completely isolated HTML
    const navHTML = `
      <div id="simple-mobile-nav" style="
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        background: #1f2937;
        border-top: 1px solid #374151;
        z-index: 9999;
        display: flex;
        justify-content: space-around;
        padding: 12px 0;
      ">
        <a href="/" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          color: #9ca3af;
          text-decoration: none;
          width: 100%;
          font-size: 12px;
          font-weight: 500;
        " onmouseover="this.style.color='white'" onmouseout="this.style.color='#9ca3af'">
          HOME
        </a>
        <a href="/sportsbook" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          color: #9ca3af;
          text-decoration: none;
          width: 100%;
          font-size: 12px;
          font-weight: 500;
        " onmouseover="this.style.color='white'" onmouseout="this.style.color='#9ca3af'">
          SPORTS
        </a>
        <a href="/showdown" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          color: #9ca3af;
          text-decoration: none;
          width: 100%;
          font-size: 12px;
          font-weight: 500;
        " onmouseover="this.style.color='white'" onmouseout="this.style.color='#9ca3af'">
          SHOWDOWN
        </a>
        <a href="/my-bets" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          color: #9ca3af;
          text-decoration: none;
          width: 100%;
          font-size: 12px;
          font-weight: 500;
        " onmouseover="this.style.color='white'" onmouseout="this.style.color='#9ca3af'">
          MY BETS
        </a>
        <a href="/social" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          color: #9ca3af;
          text-decoration: none;
          width: 100%;
          font-size: 12px;
          font-weight: 500;
        " onmouseover="this.style.color='white'" onmouseout="this.style.color='#9ca3af'">
          FRIENDS
        </a>
        <a href="/notifications" style="
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 8px;
          color: #9ca3af;
          text-decoration: none;
          width: 100%;
          font-size: 12px;
          font-weight: 500;
        " onmouseover="this.style.color='white'" onmouseout="this.style.color='#9ca3af'">
          ALERTS
        </a>
      </div>
    `

    // Insert into body
    document.body.insertAdjacentHTML('beforeend', navHTML)

    // Cleanup
    return () => {
      const existing = document.getElementById('simple-mobile-nav')
      if (existing) {
        existing.remove()
      }
    }
  }, [status])

  // This component renders nothing - navigation is pure HTML
  return null
}
