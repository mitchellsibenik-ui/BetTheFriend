'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface Notification {
  id: number
  type: 'FRIEND_REQUEST' | 'WAGER'
  message: string
  createdAt: string
  read: boolean
  data: {
    senderId?: number
    senderUsername?: string
    wagerId?: number
    amount?: number
    terms?: string
  }
}

export default function NotificationList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const router = useRouter()
  const { data: session, status } = useSession()

  const fetchNotifications = async () => {
    try {
      if (status !== 'authenticated') {
        router.push('/auth/login')
        return
      }

      // Fetch friend request notifications
      const friendResponse = await fetch('/api/notifications/friend-requests')

      // Fetch wager notifications
      const wagerResponse = await fetch('/api/notifications/wager')

      if (!friendResponse.ok || !wagerResponse.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const friendData = await friendResponse.json()
      const wagerData = await wagerResponse.json()

      // Combine and sort notifications by date
      const allNotifications = [
        ...friendData.notifications,
        ...wagerData.notifications
      ].sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )

      setNotifications(allNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      setError('Failed to load notifications')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFriendRequest = async (senderId: number, action: 'ACCEPT' | 'DENY') => {
    try {
      if (status !== 'authenticated') {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ senderId, action })
      })

      if (!response.ok) {
        throw new Error('Failed to respond to friend request')
      }

      // Refresh notifications
      fetchNotifications()
    } catch (error) {
      console.error('Error responding to friend request:', error)
      setError('Failed to respond to friend request')
    }
  }

  const handleWagerResponse = async (wagerId: number, action: 'ACCEPT' | 'DENY') => {
    try {
      if (status !== 'authenticated') {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/wagers/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ wagerId, action })
      })

      if (!response.ok) {
        throw new Error('Failed to respond to wager')
      }

      // Refresh notifications
      fetchNotifications()
    } catch (error) {
      console.error('Error responding to wager:', error)
      setError('Failed to respond to wager')
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications()
    }
  }, [status])

  if (status === 'loading') {
    return <div className="text-white">Loading...</div>
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login')
    return null
  }

  if (isLoading) {
    return <div className="text-white">Loading notifications...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  return (
    <div className="space-y-4">
      {notifications.length === 0 ? (
        <p className="text-gray-400">No notifications</p>
      ) : (
        notifications.map((notification) => (
          <div
            key={notification.id}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700"
          >
            <p className="text-white mb-2">{notification.message}</p>
            <p className="text-gray-400 text-sm mb-4">
              {new Date(notification.createdAt).toLocaleString()}
            </p>
            
            {notification.type === 'FRIEND_REQUEST' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleFriendRequest(notification.data.senderId!, 'ACCEPT')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleFriendRequest(notification.data.senderId!, 'DENY')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Deny
                </button>
              </div>
            )}

            {notification.type === 'WAGER' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleWagerResponse(notification.data.wagerId!, 'ACCEPT')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  Accept
                </button>
                <button
                  onClick={() => handleWagerResponse(notification.data.wagerId!, 'DENY')}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Deny
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
} 