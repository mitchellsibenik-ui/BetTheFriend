'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import FriendRequestsInbox from '@/components/FriendRequestsInbox'
import SendFriendRequest from '@/components/SendFriendRequest'
import CreateWagerForm from '@/components/CreateWagerForm'
import { useRouter } from 'next/navigation'

interface Friend {
  id: string
  username: string
  createdAt: string
  status: string
  stats: {
    wins: number
    losses: number
    profit: number
    totalBets: number
  }
}

export default function SocialPage() {
  const { data: session } = useSession()
  const [friends, setFriends] = useState<Friend[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showAddFriend, setShowAddFriend] = useState(false)
  const [showCreateWager, setShowCreateWager] = useState(false)
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null)
  const [wagerAmount, setWagerAmount] = useState('')
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [notification, setNotification] = useState<string | null>(null)
  const [hasNewNotifications, setHasNewNotifications] = useState(false)
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false)
  const [friendToRemove, setFriendToRemove] = useState<{ id: string; username: string } | null>(null)
  const router = useRouter()

  useEffect(() => {
    fetchFriends()
    // Listen for friend request accepted events
    const handleFriendRequestAccepted = () => {
      fetchFriends()
    }
    window.addEventListener('friendRequestAccepted', handleFriendRequestAccepted)
    return () => {
      window.removeEventListener('friendRequestAccepted', handleFriendRequestAccepted)
    }
  }, [])

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const response = await fetch('/api/notifications')
        const data = await response.json()
        
        if (data.hasNewNotifications) {
          setHasNewNotifications(true)
          // Remove sound notification
          // new Audio('/notification.mp3').play()
        }
      } catch (error) {
        console.error('Error checking notifications:', error)
      }
    }

    const interval = setInterval(checkNotifications, 30000)
    checkNotifications()

    return () => clearInterval(interval)
  }, [])

  const fetchFriends = async () => {
    try {
      setIsLoading(true)
      setError('')
      const response = await fetch('/api/friends/list')
      if (!response.ok) {
        throw new Error('Failed to fetch friends')
      }
      const data = await response.json()
      const friendsWithStats = data.friends.map((friend: Friend) => ({
        ...friend,
        stats: friend.stats || {
          wins: 0,
          losses: 0,
          profit: 0,
          totalBets: 0
        }
      }))
      // Sort friends by profit
      const sortedFriends = friendsWithStats.sort((a: Friend, b: Friend) => b.stats.profit - a.stats.profit)
      setFriends(sortedFriends)
      setPendingRequests(data.pendingRequests || [])
    } catch (error) {
      console.error('Error fetching friends:', error)
      setError('Failed to load friends')
    } finally {
      setIsLoading(false)
    }
  }

  const handleRemoveFriend = async (friendId: string, friendUsername: string) => {
    setFriendToRemove({ id: friendId, username: friendUsername })
    setShowRemoveConfirm(true)
  }

  const confirmRemoveFriend = async () => {
    if (!friendToRemove) return

    try {
      const response = await fetch(`/api/friends/${friendToRemove.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove friend')
      }

      await fetchFriends()
      setNotification(`${friendToRemove.username} has been removed from your friends list`)
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error removing friend:', error)
      setError('Failed to remove friend')
    } finally {
      setShowRemoveConfirm(false)
      setFriendToRemove(null)
    }
  }

  const handleResponse = async (requestId: string, accept: boolean) => {
    try {
      const response = await fetch('/api/friends/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ friendshipId: requestId, accept })
      })

      if (!response.ok) {
        throw new Error('Failed to respond to friend request')
      }

      // Remove the request from pending requests
      setPendingRequests(prev => prev.filter(req => req.id !== requestId))

      // If accepted, refresh the friends list
      if (accept) {
        fetchFriends()
      }

      // Show success notification
      setNotification(accept ? 'Friend request accepted!' : 'Friend request declined')
      setTimeout(() => setNotification(null), 3000)
    } catch (error) {
      console.error('Error responding to friend request:', error)
      setNotification('Error responding to friend request')
      setTimeout(() => setNotification(null), 3000)
    }
  }

  const handleCreateWager = () => {
    if (!selectedFriend || !wagerAmount) {
      setNotification('Please select a friend and enter an amount')
      setTimeout(() => setNotification(null), 3000)
      return
    }

    const selectedFriendData = friends.find(f => f.id === selectedFriend)
    if (!selectedFriendData) {
      setNotification('Friend not found')
      setTimeout(() => setNotification(null), 3000)
      return
    }

    // Check if the selected user is actually a friend
    const isFriend = friends.some(f => f.id === selectedFriend && f.status === 'ACCEPTED')
    if (!isFriend) {
      setNotification('You can only create wagers with friends')
      setTimeout(() => setNotification(null), 3000)
      return
    }

    // Store the wager details in localStorage
    const wagerData = {
      friendId: selectedFriend,
      amount: wagerAmount,
      friendName: selectedFriendData.username
    }
    localStorage.setItem('pendingWager', JSON.stringify(wagerData))

    // Close the modal
    setShowCreateWager(false)
    setSelectedFriend(null)
    setWagerAmount('')
    
    // Redirect to sportsbook page
    router.push('/sportsbook')
  }

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <h1 className="text-xl sm:text-2xl font-bold text-white">Friends</h1>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <div className="relative">
            <button
              onClick={() => setShowAddFriend(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
              <span className="hidden sm:inline">Add Friend</span>
              <span className="sm:hidden">Add</span>
            </button>
            {pendingRequests.length > 0 && (
              <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center animate-pulse">
                {pendingRequests.length}
              </div>
            )}
          </div>
          <button
            onClick={() => setShowCreateWager(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-3 sm:px-4 py-2 rounded-lg transition flex items-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="hidden sm:inline">Create Wager</span>
            <span className="sm:hidden">Wager</span>
          </button>
          <FriendRequestsInbox />
        </div>
      </div>

      {/* Pending Requests Box */}
      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-gray-800 rounded-lg border border-gray-700 p-4">
          <h2 className="text-lg font-semibold text-white mb-3">Pending Requests</h2>
          <div className="space-y-3">
            {pendingRequests.map((request) => (
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
        </div>
      )}

      {/* Add Friend Modal */}
      {showAddFriend && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Add Friend</h2>
              <button
                onClick={() => setShowAddFriend(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <SendFriendRequest />
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="text-center py-8">
          <div className="text-gray-400">Loading friends...</div>
        </div>
      ) : friends.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400">No friends yet. Add some friends to start betting!</div>
        </div>
      ) : (
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          {/* Leaderboard Header */}
          <div className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-700 text-xs sm:text-sm font-medium text-gray-300">
            <div className="col-span-1">Rank</div>
            <div className="col-span-5 sm:col-span-4">Username</div>
            <div className="col-span-2 sm:col-span-1 text-right">Record</div>
            <div className="col-span-2 text-right">Win Rate</div>
            <div className="col-span-2 text-right">Total Bets</div>
            <div className="col-span-2 text-right">P/L</div>
          </div>

          {/* Friends List */}
          <div className="divide-y divide-gray-700 max-h-[600px] overflow-y-auto">
            {friends.map((friend, index) => (
              <div key={friend.id} className="grid grid-cols-12 gap-2 sm:gap-4 p-3 sm:p-4 hover:bg-gray-750 transition-colors">
                <div className="col-span-1 text-gray-400 text-sm">{index + 1}</div>
                <div className="col-span-5 sm:col-span-4 flex items-center justify-between min-w-0">
                  <div className="flex items-center space-x-2 min-w-0 flex-1">
                    <div className="text-white font-medium truncate">
                      {friend.username}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1 ml-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        setSelectedFriend(friend.id)
                        setShowCreateWager(true)
                      }}
                      className="text-gray-400 hover:text-green-500 transition-colors p-1"
                      title="Create wager"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(friend.id, friend.username)}
                      className="text-gray-400 hover:text-red-500 transition-colors p-1"
                      title="Remove friend"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="col-span-2 sm:col-span-1 text-right text-white text-sm">
                  {friend.stats.wins}-{friend.stats.losses}
                </div>
                <div className="col-span-2 text-right text-white text-sm">
                  {friend.stats.totalBets > 0
                    ? `${Math.round((friend.stats.wins / friend.stats.totalBets) * 100)}%`
                    : '0%'}
                </div>
                <div className="col-span-2 text-right text-white text-sm">
                  {friend.stats.totalBets}
                </div>
                <div className={`col-span-2 text-right font-medium text-sm ${
                  friend.stats.profit >= 0 ? 'text-green-500' : 'text-red-500'
                }`}>
                  {friend.stats.profit >= 0 ? '+' : ''}${friend.stats.profit}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Wager Modal */}
      {showCreateWager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">Create Wager</h2>
              <button
                onClick={() => {
                  setShowCreateWager(false)
                  setSelectedFriend(null)
                  setWagerAmount('')
                }}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Select Friend
                </label>
                <select
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={selectedFriend || ''}
                  onChange={(e) => setSelectedFriend(e.target.value)}
                  required
                >
                  <option value="">Choose a friend...</option>
                  {friends.map((friend) => (
                    <option key={friend.id} value={friend.id}>
                      {friend.username}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">
                  Wager Amount ($)
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                  value={wagerAmount}
                  onChange={(e) => setWagerAmount(e.target.value)}
                  placeholder="Enter amount..."
                  required
                />
              </div>

              <button
                onClick={handleCreateWager}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!selectedFriend || !wagerAmount}
              >
                Select Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Friend Confirmation Modal */}
      {showRemoveConfirm && friendToRemove && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="text-center">
              <h3 className="text-xl font-bold text-white mb-4">Remove Friend</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to remove {friendToRemove.username} from your friends list?
              </p>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false)
                    setFriendToRemove(null)
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveFriend}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg border border-gray-700 animate-fade-in z-50">
          {notification}
        </div>
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in z-50">
          {error}
        </div>
      )}
    </div>
  )
}
 