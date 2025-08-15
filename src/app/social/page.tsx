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

  // Generate a unique color for each user based on their username
  const getUserColor = (username: string) => {
    const colors = [
      'from-blue-500 to-purple-600',
      'from-green-500 to-teal-600',
      'from-pink-500 to-red-600',
      'from-yellow-500 to-orange-600',
      'from-indigo-500 to-blue-600',
      'from-purple-500 to-pink-600',
      'from-teal-500 to-green-600',
      'from-orange-500 to-red-600'
    ]
    const index = username.charCodeAt(0) % colors.length
    return colors[index]
  }

  // Get status indicator color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return 'bg-green-500'
      case 'PENDING':
        return 'bg-yellow-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Enhanced Header with Glassmorphism */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl blur-3xl"></div>
          <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Friends Hub
                </h1>
                <p className="text-gray-400 text-sm sm:text-base">
                  Connect, compete, and create wagers with your friends
                </p>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                <div className="relative group">
                  <button
                    onClick={() => setShowAddFriend(true)}
                    className="relative bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center gap-3 text-sm font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
                  >
                    <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="hidden sm:inline">Add Friend</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                  {pendingRequests.length > 0 && (
                    <div className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse shadow-lg">
                      {pendingRequests.length}
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => setShowCreateWager(true)}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-6 py-3 rounded-2xl transition-all duration-300 flex items-center gap-3 text-sm font-medium shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                >
                  <div className="w-5 h-5 bg-white/20 rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <span className="hidden sm:inline">Create Wager</span>
                  <span className="sm:hidden">Wager</span>
                </button>
                
                <div className="transform hover:scale-105 transition-transform duration-200">
                  <FriendRequestsInbox />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Pending Requests Box */}
        {pendingRequests.length > 0 && (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-6H4v6z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-white">Pending Friend Requests</h2>
                <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              </div>
              
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pendingRequests.map((request) => (
                  <div key={request.id} className="group bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl p-4 transition-all duration-300 hover:scale-105 hover:shadow-xl">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getUserColor(request.sender.username)} flex items-center justify-center text-white font-bold text-lg shadow-lg`}>
                        {request.sender.username.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">{request.sender.username}</div>
                        <div className="text-sm text-gray-400">Sent {new Date(request.sender.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleResponse(request.id, true)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-2 px-4 rounded-xl transition-all duration-200 font-medium hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-105"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => handleResponse(request.id, false)}
                        className="flex-1 bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white py-2 px-4 rounded-xl transition-all duration-200 font-medium hover:shadow-lg transform hover:scale-105"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Friends List */}
        {isLoading ? (
          <div className="text-center py-16">
            <div className="inline-flex items-center gap-3">
              <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-gray-400 text-lg">Loading your friends...</div>
            </div>
          </div>
        ) : friends.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No friends yet</h3>
            <p className="text-gray-400 mb-6">Add some friends to start betting and competing!</p>
            <button
              onClick={() => setShowAddFriend(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-8 py-3 rounded-2xl transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-105"
            >
              Add Your First Friend
            </button>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl blur-xl"></div>
            <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden">
              {/* Enhanced Leaderboard Header */}
              <div className="bg-gradient-to-r from-gray-800/80 to-gray-700/80 backdrop-blur-sm p-6 border-b border-white/10">
                <div className="grid grid-cols-12 gap-4 text-sm font-semibold text-gray-300">
                  <div className="col-span-1 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                    Rank
                  </div>
                  <div className="col-span-5 sm:col-span-4 flex items-center gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Player
                  </div>
                  <div className="col-span-2 sm:col-span-1 text-right flex items-center justify-end gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Record
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Win Rate
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    Bets
                  </div>
                  <div className="col-span-2 text-right flex items-center justify-end gap-2">
                    <div className="w-6 h-6 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    P/L
                  </div>
                </div>
              </div>

              {/* Enhanced Friends List */}
              <div className="divide-y divide-white/10 max-h-[600px] overflow-y-auto">
                {friends.map((friend, index) => (
                  <div key={friend.id} className="group hover:bg-white/5 transition-all duration-300 hover:scale-[1.02]">
                    <div className="grid grid-cols-12 gap-4 p-6">
                      {/* Rank */}
                      <div className="col-span-1 flex items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          index === 0 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900' :
                          index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-gray-800' :
                          index === 2 ? 'bg-gradient-to-r from-amber-600 to-amber-800 text-amber-100' :
                          'bg-gradient-to-r from-gray-600 to-gray-700 text-gray-300'
                        }`}>
                          {index + 1}
                        </div>
                      </div>

                      {/* Username and Actions */}
                      <div className="col-span-5 sm:col-span-4 flex items-center justify-between min-w-0">
                        <div className="flex items-center space-x-4 min-w-0 flex-1">
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getUserColor(friend.username)} flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                            {friend.username.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="text-white font-semibold text-lg truncate group-hover:text-blue-300 transition-colors duration-200">
                              {friend.username}
                            </div>
                            <div className="text-sm text-gray-400">
                              Friends since {new Date(friend.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 ml-4 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={() => {
                              setSelectedFriend(friend.id)
                              setShowCreateWager(true)
                            }}
                            className="p-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-green-500/25 transform hover:scale-110"
                            title="Create wager"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleRemoveFriend(friend.id, friend.username)}
                            className="p-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 transform hover:scale-110"
                            title="Remove friend"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>

                      {/* Record */}
                      <div className="col-span-2 sm:col-span-1 text-right">
                        <div className="text-white font-semibold text-lg">
                          {friend.stats.wins}-{friend.stats.losses}
                        </div>
                        <div className="text-sm text-gray-400">W-L</div>
                      </div>

                      {/* Win Rate */}
                      <div className="col-span-2 text-right">
                        <div className="text-white font-semibold text-lg">
                          {friend.stats.totalBets > 0
                            ? `${Math.round((friend.stats.wins / friend.stats.totalBets) * 100)}%`
                            : '0%'}
                        </div>
                        <div className="text-sm text-gray-400">Win %</div>
                      </div>

                      {/* Total Bets */}
                      <div className="col-span-2 text-right">
                        <div className="text-white font-semibold text-lg">
                          {friend.stats.totalBets}
                        </div>
                        <div className="text-sm text-gray-400">Total</div>
                      </div>

                      {/* Profit/Loss */}
                      <div className="col-span-2 text-right">
                        <div className={`font-bold text-lg ${
                          friend.stats.profit >= 0 ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {friend.stats.profit >= 0 ? '+' : ''}${friend.stats.profit}
                        </div>
                        <div className="text-sm text-gray-400">Profit</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Add Friend Modal */}
        {showAddFriend && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Add Friend</h2>
                <button
                  onClick={() => setShowAddFriend(false)}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <SendFriendRequest />
            </div>
          </div>
        )}

        {/* Enhanced Create Wager Modal */}
        {showCreateWager && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-white">Create Wager</h2>
                <button
                  onClick={() => {
                    setShowCreateWager(false)
                    setSelectedFriend(null)
                    setWagerAmount('')
                  }}
                  className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-all duration-200"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Select Friend
                  </label>
                  <select
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm"
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
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    Wager Amount ($)
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    className="w-full bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 backdrop-blur-sm placeholder-gray-400"
                    value={wagerAmount}
                    onChange={(e) => setWagerAmount(e.target.value)}
                    placeholder="Enter amount..."
                    required
                  />
                </div>

                <button
                  onClick={handleCreateWager}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 px-6 rounded-2xl transition-all duration-300 font-medium shadow-lg hover:shadow-blue-500/25 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  disabled={!selectedFriend || !wagerAmount}
                >
                  Select Game
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Remove Friend Confirmation Modal */}
        {showRemoveConfirm && friendToRemove && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl text-center">
              <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              
              <h3 className="text-2xl font-bold text-white mb-4">Remove Friend</h3>
              <p className="text-gray-300 mb-8 text-lg">
                Are you sure you want to remove <span className="text-white font-semibold">{friendToRemove.username}</span> from your friends list?
              </p>
              
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => {
                    setShowRemoveConfirm(false)
                    setFriendToRemove(null)
                  }}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all duration-200 font-medium hover:scale-105"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmRemoveFriend}
                  className="px-6 py-3 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white rounded-2xl transition-all duration-200 font-medium hover:shadow-lg hover:shadow-red-500/25 transform hover:scale-105"
                >
                  Remove
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Notification Toast */}
        {notification && (
          <div className="fixed bottom-6 right-6 bg-white/10 backdrop-blur-xl border border-white/20 text-white px-8 py-4 rounded-2xl shadow-2xl animate-fade-in z-50 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{notification}</span>
            </div>
          </div>
        )}

        {/* Enhanced Error Toast */}
        {error && (
          <div className="fixed bottom-6 right-6 bg-gradient-to-r from-red-600 to-pink-600 text-white px-8 py-4 rounded-2xl shadow-2xl animate-fade-in z-50 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
 