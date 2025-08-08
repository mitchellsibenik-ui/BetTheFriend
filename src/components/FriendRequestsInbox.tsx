'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'

interface FriendRequest {
  id: number
  status: string
  sender: {
    id: number
    username: string
    createdAt: string
  }
  receiver: {
    id: number
    username: string
    createdAt: string
  }
}

export default function FriendRequestsInbox() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [notification, setNotification] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  // Fetch requests when component mounts and when inbox is opened
  useEffect(() => {
    if (isOpen && status === 'authenticated') {
      fetchRequests()
    }
  }, [isOpen, status])

  // Set up polling for new requests
  useEffect(() => {
    if (status === 'authenticated') {
      const pollInterval = setInterval(fetchRequests, 30000) // Poll every 30 seconds
      return () => clearInterval(pollInterval)
    }
  }, [status])

  const fetchRequests = async () => {
    try {
      setIsLoading(true)
      if (status !== 'authenticated') {
        router.push('/auth/login')
        return
      }

      const response = await fetch('/api/friends/list')

      if (!response.ok) {
        throw new Error('Failed to fetch friend requests')
      }

      const data = await response.json()
      const newRequests = data.pendingRequests

      // Show notification if there are new requests
      if (newRequests.length > requests.length) {
        const newCount = newRequests.length - requests.length
        setNotification(`${newCount} new friend request${newCount > 1 ? 's' : ''}`)
        // Play notification sound
        const audio = new Audio('/notification.mp3')
        audio.play().catch(() => {}) // Ignore errors if audio fails to play
      }

      setRequests(newRequests)
    } catch (error) {
      console.error('Error fetching friend requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResponse = async (friendshipId: number, accept: boolean) => {
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
        body: JSON.stringify({ friendshipId, accept })
      })

      if (!response.ok) {
        throw new Error('Failed to respond to friend request')
      }

      // Show success notification
      setNotification(accept ? 'Friend request accepted!' : 'Friend request declined')
      setTimeout(() => setNotification(null), 3000)

      // Remove the request from the list
      setRequests(requests.filter(req => req.id !== friendshipId))

      // If accepted, trigger a page refresh to update the friends list
      if (accept) {
        // Dispatch a custom event to notify other components
        window.dispatchEvent(new CustomEvent('friendRequestAccepted'))
        // Refresh the current page
        router.refresh()
      }
    } catch (error) {
      console.error('Error responding to friend request:', error)
      setNotification('Error responding to friend request')
      setTimeout(() => setNotification(null), 3000)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-300 hover:text-white transition"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {requests.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
            {requests.length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-800 rounded-lg shadow-xl border border-gray-700 z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold text-white mb-4">Friend Requests</h3>
            {isLoading ? (
              <div className="text-gray-400 text-center py-4">Loading...</div>
            ) : requests.length === 0 ? (
              <div className="text-gray-400 text-center py-4">No pending requests</div>
            ) : (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg hover:bg-gray-700/70 transition">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {request.sender.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">{request.sender.username}</div>
                        <div className="text-sm text-gray-400">Sent {new Date(request.sender.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResponse(request.id, true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleResponse(request.id, false)}
                        className="px-3 py-1 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg border border-gray-700 animate-fade-in">
          {notification}
        </div>
      )}
    </div>
  )
} 