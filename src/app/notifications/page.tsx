'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'

interface Notification {
  id: string
  type: string
  message: string
  data: string
  read: boolean
  createdAt: string
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [respondingTo, setRespondingTo] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/notifications')
      if (!response.ok) {
        throw new Error('Failed to fetch notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications || [])
    } catch (err) {
      console.error('Error fetching notifications:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications')
      toast.error('Failed to load notifications')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchNotifications()
    }
  }, [status])

  const handleRespondToInvite = async (notificationId: string, action: 'accept' | 'decline') => {
    try {
      setRespondingTo(notificationId)
      
      const response = await fetch(`/api/notifications/${notificationId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        await fetchNotifications() // Refresh notifications list
        window.dispatchEvent(new Event('notificationUpdate')) // Trigger counter update
        
        // Also trigger a small delay to ensure the counter updates
        setTimeout(() => {
          window.dispatchEvent(new Event('notificationUpdate'))
        }, 100)
        
        toast.success(action === 'accept' ? 'Invitation accepted!' : 'Invitation declined')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to respond to invitation')
      }
    } catch (error) {
      console.error('Error responding to invitation:', error)
      toast.error('Failed to respond to invitation')
    } finally {
      setRespondingTo(null)
    }
  }

  const handleFriendRequest = async (senderId: string, accept: boolean) => {
    try {
      setRespondingTo(senderId)
      
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ senderId, accept }),
      })

      if (response.ok) {
        await fetchNotifications() // Refresh notifications list
        window.dispatchEvent(new Event('notificationUpdate')) // Trigger counter update
        
        // Also trigger a small delay to ensure the counter updates
        setTimeout(() => {
          window.dispatchEvent(new Event('notificationUpdate'))
        }, 100)
        
        toast.success(accept ? 'Friend request accepted!' : 'Friend request declined')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to respond to friend request')
      }
    } catch (error) {
      console.error('Error responding to friend request:', error)
      toast.error('Failed to respond to friend request')
    } finally {
      setRespondingTo(null)
    }
  }

  const handleBetResponse = async (betId: string, action: 'accept' | 'decline') => {
    try {
      setRespondingTo(betId)
      
      const response = await fetch(`/api/bets/${betId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action }),
      })

      if (response.ok) {
        // Remove the notification from the list
        setNotifications(prev => prev.filter(n => {
          const data = getNotificationData(n)
          return data.betId !== betId
        }))
        
        // Trigger balance and notification updates immediately
        window.dispatchEvent(new Event('balanceUpdate'))
        window.dispatchEvent(new Event('notificationUpdate'))
        
        // Also trigger a small delay to ensure the counter updates
        setTimeout(() => {
          window.dispatchEvent(new Event('notificationUpdate'))
        }, 100)
        
        toast.success(action === 'accept' ? 'Bet accepted!' : 'Bet declined')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to respond to bet')
      }
    } catch (error) {
      console.error('Error responding to bet:', error)
      toast.error('Failed to respond to bet')
    } finally {
      setRespondingTo(null)
    }
  }

  const handleNotificationClick = async (notification: Notification) => {
    const notificationData = getNotificationData(notification)
    
    if (notification.read) return

    try {
      const response = await fetch(`/api/notifications`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ notificationId: notification.id }),
      })

      if (response.ok) {
        // Update the notification as read locally
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, read: true } : n
          )
        )
        
        // Trigger notification counter update
        window.dispatchEvent(new Event('notificationUpdate'))
        
        console.log('Successfully marked notification as read')
      } else {
        console.error('Failed to mark notification as read')
      }
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
    
    if (notification.type === 'bet' && notificationData.betId) {
      // Navigate to pending bets page
      router.push(`/my-bets/${notificationData.betId}`)
    }
  }

  const handleClearAllNotifications = async () => {
    try {
      const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
      })

      if (response.ok) {
        setNotifications([])
        window.dispatchEvent(new Event('notificationUpdate'))
        toast.success('All notifications cleared!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to clear notifications')
      }
    } catch (error) {
      console.error('Error clearing notifications:', error)
      toast.error('Failed to clear notifications')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getNotificationData = (notification: Notification) => {
    try {
      return JSON.parse(notification.data)
    } catch {
      return {}
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-xl text-gray-300">Loading notifications...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
              <button
                onClick={fetchNotifications}
                className="mt-4 px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
      <div className="max-w-4xl mx-auto px-2 sm:px-4 lg:px-8 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Notifications</h1>
          <div className="flex space-x-2 sm:space-x-3">
            {notifications.length > 0 && (
              <button
                onClick={handleClearAllNotifications}
                className="px-3 py-1.5 sm:px-4 sm:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm sm:text-base"
              >
                Clear All
              </button>
            )}
            <button
              onClick={fetchNotifications}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm sm:text-base"
            >
              Refresh
            </button>
          </div>
        </div>

        {notifications.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-800 rounded-xl p-8">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <p className="text-gray-400 text-lg">No notifications</p>
              <p className="text-gray-500 mt-2">You're all caught up!</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => {
              const notificationData = getNotificationData(notification)
              
              return (
                <div
                  key={notification.id}
                  className={`bg-gray-800 rounded-xl p-6 border ${
                    notification.read ? 'border-gray-700' : 'border-blue-500'
                  } ${notification.type === 'bet' ? 'cursor-pointer hover:bg-gray-750 transition-colors' : ''}`}
                  onClick={() => notification.type === 'bet' && handleNotificationClick(notification)}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {notification.type === 'room_invite' ? 'Showdown Invitation' : 
                         notification.type === 'friend_request' ? 'Friend Request' : 'Notification'}
                      </h3>
                      <p className="text-gray-300 mb-2">{notification.message}</p>
                      {notification.type === 'room_invite' && notificationData.entryFee && (
                        <p className="text-gray-400 text-sm">
                          Entry Fee: <span className="text-green-400">${notificationData.entryFee}</span>
                        </p>
                      )}
                      <p className="text-gray-500 text-sm mt-2">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                    {!notification.read && (
                      <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
                    )}
                  </div>

                  {!notification.read && (
                    <div className="flex gap-3 mt-4">
                      {notification.type === 'room_invite' && (
                        <>
                          <button
                            onClick={() => handleRespondToInvite(notification.id, 'accept')}
                            disabled={respondingTo === notification.id}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {respondingTo === notification.id ? 'Accepting...' : 'Accept Invitation'}
                          </button>
                          <button
                            onClick={() => handleRespondToInvite(notification.id, 'decline')}
                            disabled={respondingTo === notification.id}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {respondingTo === notification.id ? 'Declining...' : 'Decline'}
                          </button>
                        </>
                      )}
                      {notification.type === 'friend_request' && (
                        <>
                          <button
                            onClick={() => handleFriendRequest(notificationData.senderId, true)}
                            disabled={respondingTo === notification.id}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {respondingTo === notification.id ? 'Accepting...' : 'Accept Request'}
                          </button>
                          <button
                            onClick={() => handleFriendRequest(notificationData.senderId, false)}
                            disabled={respondingTo === notification.id}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {respondingTo === notification.id ? 'Declining...' : 'Decline'}
                          </button>
                        </>
                      )}
                      {notification.type === 'bet' && (
                        <div className="flex gap-3 mt-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleNotificationClick(notification)
                            }}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            View Bet Details
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
} 