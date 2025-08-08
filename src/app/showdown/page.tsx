'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { useDebounce } from 'use-debounce'

interface ShowdownRoom {
  id: string
  name: string
  creatorId: string
  entryFee: number
  status: string
  createdAt: string
  updatedAt: string
  creator: {
    id: string
    username: string
  }
  participants: Array<{
    id: string
    userId: string
    roomId: string
    score: number
    user: {
      id: string
      username: string
    }
  }>
}

interface Friend {
  id: string
  username: string
  email: string
}

export default function ShowdownPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [rooms, setRooms] = useState<ShowdownRoom[]>([])
  const [friends, setFriends] = useState<Friend[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<ShowdownRoom | null>(null)
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isJoining, setIsJoining] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [newRoomData, setNewRoomData] = useState({
    name: '',
    entryFee: 0
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)

      const [roomsRes, friendsRes] = await Promise.all([
        fetch('/api/showdown/rooms'),
        fetch('/api/friends')
      ])

      if (!roomsRes.ok || !friendsRes.ok) {
        throw new Error('Failed to fetch data')
      }

      const [roomsData, friendsData] = await Promise.all([
        roomsRes.json(),
        friendsRes.json()
      ])

      // Filter rooms by status
      const filteredRooms = statusFilter === 'all' 
        ? roomsData 
        : roomsData.filter((room: ShowdownRoom) => room.status === statusFilter)

      setRooms(Array.isArray(filteredRooms) ? filteredRooms : [])
      setFriends(friendsData || [])
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch data')
      toast.error('Failed to load showdowns')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, statusFilter])

  const handleCreateShowdown = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session?.user) return

    try {
      setIsCreating(true)
      const response = await fetch('/api/showdown/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newRoomData),
      })

      if (!response.ok) {
        throw new Error('Failed to create showdown')
      }

      const room = await response.json()
      setRooms(prev => [room, ...prev])
      setIsCreateModalOpen(false)
      setNewRoomData({ name: '', entryFee: 0 })
      toast.success('Showdown created successfully!')
    } catch (err) {
      console.error('Error creating showdown:', err)
      setError('Failed to create showdown')
      toast.error('Failed to create showdown')
    } finally {
      setIsCreating(false)
    }
  }

  const handleInviteFriends = async () => {
    if (!selectedRoom || selectedFriends.length === 0) return

    try {
      setIsInviting(true)
      const response = await fetch(`/api/showdown/rooms/${selectedRoom.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendIds: selectedFriends }),
      })

      if (!response.ok) {
        throw new Error('Failed to send invites')
      }

      const result = await response.json()
      setIsInviteModalOpen(false)
      setSelectedRoom(null)
      setSelectedFriends([])
      toast.success(result.message)
    } catch (err) {
      console.error('Error sending invites:', err)
      toast.error('Failed to send invites')
    } finally {
      setIsInviting(false)
    }
  }

  const handleJoinShowdown = async (roomId: string) => {
    if (!session?.user) return

    try {
      setIsJoining(roomId)
      const response = await fetch(`/api/showdown/rooms/${roomId}/join`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to join showdown')
      }

      await fetchData()
      toast.success('Successfully joined the showdown!')
    } catch (err) {
      console.error('Error joining showdown:', err)
      setError('Failed to join showdown')
      toast.error('Failed to join showdown')
    } finally {
      setIsJoining(null)
    }
  }

  const openInviteModal = (room: ShowdownRoom) => {
    setSelectedRoom(room)
    setSelectedFriends([])
    setIsInviteModalOpen(true)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
            <p className="mt-4 text-xl text-gray-300">Loading showdowns...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
              <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-red-500 text-lg font-medium mb-2">{error}</p>
              <button
                onClick={fetchData}
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-white">Showdown</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Create Showdown
          </button>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        {/* Showdowns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-700 hover:border-blue-500 transition-colors"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white">{room.name}</h3>
                  <p className="text-gray-400">Created by {room.creator.username}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  room.status === 'open' ? 'bg-green-500/20 text-green-400' :
                  room.status === 'in_progress' ? 'bg-blue-500/20 text-blue-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {room.status.replace('_', ' ')}
                </span>
              </div>
              <div className="space-y-2 mb-4">
                <p className="text-gray-300">Entry Fee: <span className="text-green-400">${room.entryFee}</span></p>
                <p className="text-gray-300">Participants: <span className="text-white">{room.participants.length}</span></p>
              </div>
              <div className="flex gap-2">
                {room.status === 'open' && !room.participants.some(p => p.user.id === session?.user?.id) && (
                  <button
                    onClick={() => handleJoinShowdown(room.id)}
                    disabled={isJoining === room.id}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isJoining === room.id ? 'Joining...' : 'Join Showdown'}
                  </button>
                )}
                {room.creatorId === session?.user?.id && room.status === 'open' && (
                  <button
                    onClick={() => openInviteModal(room)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Invite Friends
                  </button>
                )}
                {room.participants.some(p => p.user.id === session?.user?.id) && (
                  <button
                    onClick={() => router.push(`/showdown/room/${room.id}`)}
                    className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    View Showdown
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg">
              {statusFilter === 'all' ? 'No showdowns available.' : `No ${statusFilter} showdowns available.`}
            </p>
            <p className="text-gray-500 mt-2">Create a showdown to get started!</p>
          </div>
        )}

        {/* Create Showdown Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h2 className="text-2xl font-bold text-white mb-4">Create Showdown</h2>
              <form onSubmit={handleCreateShowdown}>
                <div className="space-y-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
                      Showdown Name
                    </label>
                    <input
                      type="text"
                      id="name"
                      value={newRoomData.name}
                      onChange={(e) => setNewRoomData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter showdown name"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="entryFee" className="block text-sm font-medium text-gray-300 mb-1">
                      Entry Fee ($)
                    </label>
                    <input
                      type="number"
                      id="entryFee"
                      value={newRoomData.entryFee}
                      onChange={(e) => setNewRoomData(prev => ({ ...prev, entryFee: Number(e.target.value) }))}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      placeholder="Enter entry fee"
                      min="0"
                      step="0.01"
                      required
                    />
                  </div>
                </div>
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating}
                    className={`px-4 py-2 rounded-lg font-medium ${
                      isCreating
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    {isCreating ? 'Creating...' : 'Create Showdown'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Invite Friends Modal */}
        {isInviteModalOpen && selectedRoom && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-white mb-4">
                Invite Friends to "{selectedRoom.name}"
              </h2>
              <p className="text-gray-400 mb-4">
                Selected friends will receive a notification and can accept or decline your invitation.
              </p>
              {friends.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-400 mb-4">You don't have any friends yet.</p>
                  <button
                    onClick={() => router.push('/social')}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Add Friends
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-2 mb-4">
                    {friends.map((friend) => (
                      <label key={friend.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg hover:bg-gray-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedFriends.includes(friend.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedFriends(prev => [...prev, friend.id])
                            } else {
                              setSelectedFriends(prev => prev.filter(id => id !== friend.id))
                            }
                          }}
                          className="w-4 h-4 text-blue-600 bg-gray-800 border-gray-600 rounded focus:ring-blue-500 focus:ring-2"
                        />
                        <span className="text-white">{friend.username}</span>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setIsInviteModalOpen(false)}
                      className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleInviteFriends}
                      disabled={selectedFriends.length === 0 || isInviting}
                      className={`px-4 py-2 rounded-lg font-medium ${
                        selectedFriends.length === 0 || isInviting
                          ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      {isInviting ? 'Sending...' : `Send Invites (${selectedFriends.length})`}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 