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
  sport: string
  sportTitle: string
  gameDate: string
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

const SPORTS_OPTIONS = [
  { key: 'baseball_mlb', title: 'MLB' },
  { key: 'americanfootball_nfl', title: 'NFL' },
  { key: 'basketball_nba', title: 'NBA' },
  { key: 'icehockey_nhl', title: 'NHL' }
]

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
    entryFee: 0,
    sport: 'baseball_mlb',
    sportTitle: 'MLB',
    gameDate: new Date().toISOString().split('T')[0]
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

      console.log('Friends API response:', friendsData)
      console.log('Friends array:', friendsData.friends)

      // Filter rooms by status
      const filteredRooms = statusFilter === 'all' 
        ? roomsData 
        : roomsData.filter((room: ShowdownRoom) => room.status === statusFilter)

      // Apply expiration filter to remove rooms where games have started
      const validRooms = getValidRooms(filteredRooms)

      setRooms(Array.isArray(validRooms) ? validRooms : [])
      setFriends(friendsData.friends || [])
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

  // Listen for showdown invitation accepted events
  useEffect(() => {
    const handleShowdownInvitationAccepted = () => {
      console.log('Showdown invitation accepted, refreshing data...')
      fetchData()
    }

    window.addEventListener('showdownInvitationAccepted', handleShowdownInvitationAccepted)
    return () => {
      window.removeEventListener('showdownInvitationAccepted', handleShowdownInvitationAccepted)
    }
  }, [])

  const handleCreateRoom = async () => {
    if (!newRoomData.name || newRoomData.entryFee <= 0) {
      toast.error('Please fill in all required fields')
      return
    }

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
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create room')
      }

      const newRoom = await response.json()
      toast.success('Showdown room created successfully!')
      setIsCreateModalOpen(false)
      setNewRoomData({
        name: '',
        entryFee: 0,
        sport: 'baseball_mlb',
        sportTitle: 'MLB',
        gameDate: new Date().toISOString().split('T')[0]
      })
      fetchData()
    } catch (err) {
      console.error('Error creating room:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to create room')
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    try {
      setIsJoining(roomId)
      const response = await fetch(`/api/showdown/rooms/${roomId}/join`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to join room')
      }

      toast.success('Successfully joined the showdown!')
      fetchData()
    } catch (err) {
      console.error('Error joining room:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to join room')
    } finally {
      setIsJoining(null)
    }
  }

  const handleInviteFriends = async () => {
    if (selectedFriends.length === 0) {
      toast.error('Please select friends to invite')
      return
    }

    if (!selectedRoom?.id) {
      toast.error('No room selected')
      return
    }

    try {
      setIsInviting(true)
      console.log('Inviting friends:', selectedFriends, 'to room:', selectedRoom.id)
      console.log('Friends data:', friends)
      
      const response = await fetch(`/api/showdown/rooms/${selectedRoom.id}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ friendIds: selectedFriends }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Invite API error:', errorData)
        throw new Error(errorData.error || 'Failed to invite friends')
      }

      const result = await response.json()
      console.log('Invite success:', result)
      
      toast.success('Friends invited successfully!')
      setIsInviteModalOpen(false)
      setSelectedFriends([])
      setSelectedRoom(null)
      
      // Trigger notification update for the invited friends
      console.log('Dispatching notificationUpdate event')
      window.dispatchEvent(new Event('notificationUpdate'))
      
      fetchData()
    } catch (err) {
      console.error('Error inviting friends:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to invite friends')
    } finally {
      setIsInviting(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'text-green-400'
      case 'in_progress':
        return 'text-yellow-400'
      case 'completed':
        return 'text-gray-400'
      default:
        return 'text-gray-400'
    }
  }

  // Check if a game has started (for expiration logic)
  const hasGameStarted = (gameDate: string) => {
    const gameStartTime = new Date(gameDate)
    const now = new Date()
    return gameStartTime < now
  }

  // Filter out rooms where games have started and they're still open
  const getValidRooms = (rooms: ShowdownRoom[]) => {
    return rooms.filter(room => {
      // If room is not open, show it (in_progress, completed, etc.)
      if (room.status !== 'open') return true
      
      // If room is open, only show if games haven't started yet
      return !hasGameStarted(room.gameDate)
    })
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto p-3 sm:p-6">
        {/* Mobile-Optimized Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              Daily Showdown
            </h1>
            <p className="text-gray-400 text-sm mt-1">Pick winners, compete with friends</p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white px-4 py-2 sm:px-6 sm:py-2 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-green-500/25 w-full sm:w-auto"
          >
            + Create Showdown
          </button>
        </div>

        {/* Mobile-Optimized Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            {['all', 'open', 'in_progress', 'completed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 ${
                  statusFilter === filter
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg'
                    : 'bg-white/10 hover:bg-white/20 text-gray-300 border border-white/20 hover:border-white/40'
                }`}
              >
                {filter === 'all' ? 'All' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile-Optimized Rooms List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <div className="text-gray-400">Loading showdowns...</div>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <div className="text-red-400 text-lg">Error: {error}</div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg">No showdowns found</div>
            <p className="text-gray-500 text-sm mt-2">Create your first showdown to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room, index) => (
              <div
                key={room.id}
                className={`relative bg-gradient-to-br from-white/8 to-white/3 backdrop-blur-xl border rounded-xl p-4 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl ${
                  index % 2 === 0 
                    ? 'border-white/20 shadow-lg hover:shadow-blue-500/10' 
                    : 'border-white/15 shadow-md hover:shadow-purple-500/10'
                }`}
              >
                {/* Mobile Layout */}
                <div className="sm:hidden">
                  {/* Header Row */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-white truncate mb-1">{room.name}</h3>
                      <div className="flex items-center space-x-2 text-xs text-gray-400">
                        <span>by {room.creator.username}</span>
                        <span>•</span>
                        <span className={getStatusColor(room.status)}>
                          {room.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0 ml-3">
                      <div className="text-xl font-bold text-green-400">
                        ${room.entryFee}
                      </div>
                      <div className="text-xs text-gray-400">Entry</div>
                    </div>
                  </div>

                  {/* Details Row */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3 text-sm text-gray-400">
                      <span className="bg-white/10 px-2 py-1 rounded-full text-xs font-medium">
                        {room.sportTitle}
                      </span>
                      <span className="bg-white/10 px-2 py-1 rounded-full text-xs font-medium">
                        {formatDate(room.gameDate)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400">
                      {room.participants.length} player{room.participants.length !== 1 ? 's' : ''}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    {room.status === 'open' && room.creatorId !== session?.user?.id && !room.participants.some(p => p.user.id === session?.user?.id) && (
                      <button
                        onClick={() => handleJoinRoom(room.id)}
                        disabled={isJoining === room.id}
                        className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 disabled:from-gray-600 disabled:to-gray-700 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                      >
                        {isJoining === room.id ? 'Joining...' : 'Join'}
                      </button>
                    )}
                    {room.creatorId === session?.user?.id && room.status === 'open' && (
                      <button
                        onClick={() => {
                          setSelectedRoom(room)
                          setIsInviteModalOpen(true)
                        }}
                        className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                      >
                        Invite
                      </button>
                    )}
                    {room.status === 'open' && (
                      <button
                        onClick={() => router.push(`/showdown/room/${room.id}`)}
                        className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white py-2.5 px-4 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
                      >
                        View
                      </button>
                    )}
                  </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden sm:block">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-semibold mb-2">{room.name}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-400">
                        <span>Created by {room.creator.username}</span>
                        <span>•</span>
                        <span className={getStatusColor(room.status)}>
                          {room.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <span>•</span>
                        <span>{room.sportTitle}</span>
                        <span>•</span>
                        <span>{formatDate(room.gameDate)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-400">
                        ${room.entryFee}
                      </div>
                      <div className="text-sm text-gray-400">
                        Entry Fee
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-400">
                      {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex space-x-2">
                      {room.status === 'open' && room.creatorId !== session?.user?.id && !room.participants.some(p => p.user.id === session?.user?.id) && (
                        <button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={isJoining === room.id}
                          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          {isJoining === room.id ? 'Joining...' : 'Join'}
                        </button>
                      )}
                      {room.creatorId === session?.user?.id && room.status === 'open' && (
                        <button
                          onClick={() => {
                            setSelectedRoom(room)
                            setIsInviteModalOpen(true)
                          }}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          Invite Friends
                        </button>
                      )}
                      {room.status === 'open' && (
                        <button
                          onClick={() => router.push(`/showdown/room/${room.id}`)}
                          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                          View Details
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Mobile-Optimized Create Room Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold mb-6 text-center">Create Daily Showdown</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="Enter room name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Sport
                  </label>
                  <select
                    value={newRoomData.sport}
                    onChange={(e) => {
                      const sport = e.target.value
                      const sportTitle = SPORTS_OPTIONS.find(s => s.key === sport)?.title || 'MLB'
                      setNewRoomData({ ...newRoomData, sport, sportTitle })
                    }}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  >
                    {SPORTS_OPTIONS.map((sport) => (
                      <option key={sport.key} value={sport.key} className="bg-gray-800">
                        {sport.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Game Date
                  </label>
                  <input
                    type="date"
                    value={newRoomData.gameDate}
                    onChange={(e) => setNewRoomData({ ...newRoomData, gameDate: e.target.value })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Entry Fee
                  </label>
                  <input
                    type="number"
                    value={newRoomData.entryFee}
                    onChange={(e) => setNewRoomData({ ...newRoomData, entryFee: Number(e.target.value) })}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isCreating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Mobile-Optimized Invite Friends Modal */}
        {isInviteModalOpen && selectedRoom && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md shadow-2xl border border-white/20">
              <h2 className="text-xl font-bold mb-6 text-center">Invite Friends to {selectedRoom.name}</h2>
              
              <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {friends.map((friend) => (
                  <label key={friend.id} className="flex items-center space-x-3 cursor-pointer p-3 rounded-lg hover:bg-white/5 transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedFriends.includes(friend.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFriends([...selectedFriends, friend.id])
                        } else {
                          setSelectedFriends(selectedFriends.filter(id => id !== friend.id))
                        }
                      }}
                      className="w-5 h-5 rounded border-white/20 text-blue-600 focus:ring-blue-500 focus:ring-2 bg-white/10"
                    />
                    <span className="text-white font-medium">{friend.username}</span>
                  </label>
                ))}
              </div>

              <div className="flex space-x-3 mt-8">
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteFriends}
                  disabled={isInviting}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:from-gray-600 disabled:to-gray-700 text-white px-4 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 disabled:transform-none"
                >
                  {isInviting ? 'Inviting...' : 'Send Invites'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 