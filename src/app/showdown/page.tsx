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

      setRooms(Array.isArray(filteredRooms) ? filteredRooms : [])
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
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Daily Showdown</h1>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
          >
            + Create Showdown
          </button>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex space-x-2">
            {['all', 'open', 'in_progress', 'completed'].map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  statusFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {filter === 'all' ? 'All' : filter.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        {/* Rooms List */}
        {loading ? (
          <div className="text-center py-8">
            <div className="text-gray-400">Loading showdowns...</div>
          </div>
        ) : error ? (
          <div className="text-center py-8">
            <div className="text-red-400">Error: {error}</div>
          </div>
        ) : rooms.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-gray-400">No showdowns found</div>
          </div>
        ) : (
          <div className="grid gap-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
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
                    {room.status === 'open' && room.creatorId !== session?.user?.id && (
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
            ))}
          </div>
        )}

        {/* Create Room Modal */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Create Daily Showdown</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={newRoomData.name}
                    onChange={(e) => setNewRoomData({ ...newRoomData, name: e.target.value })}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                  >
                    {SPORTS_OPTIONS.map((sport) => (
                      <option key={sport.key} value={sport.key}>
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
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
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
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateRoom}
                  disabled={isCreating}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Invite Friends Modal */}
        {isInviteModalOpen && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md">
              <h2 className="text-xl font-semibold mb-4">Invite Friends to {selectedRoom.name}</h2>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {friends.map((friend) => (
                  <label key={friend.id} className="flex items-center space-x-3 cursor-pointer">
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
                      className="rounded border-gray-600 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-white">{friend.username}</span>
                  </label>
                ))}
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setIsInviteModalOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInviteFriends}
                  disabled={isInviting}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
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