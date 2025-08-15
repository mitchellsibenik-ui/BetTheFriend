'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import toast from 'react-hot-toast'

interface Game {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  moneyline: Array<{
    name: string
    price: number
  }>
}

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

interface Pick {
  gameId: string
  selectedTeam: string
}

export default function ShowdownRoomPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const roomId = params.roomId as string

  const [room, setRoom] = useState<ShowdownRoom | null>(null)
  const [games, setGames] = useState<Game[]>([])
  const [picks, setPicks] = useState<Pick[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login')
    }
  }, [status, router])

  useEffect(() => {
    if (status === 'authenticated' && roomId) {
      fetchRoomData()
    }
  }, [status, roomId])

  const fetchRoomData = async () => {
    try {
      setLoading(true)
      setError(null)

      // First fetch the room data
      const roomRes = await fetch(`/api/showdown/rooms/${roomId}`)
      if (!roomRes.ok) {
        throw new Error('Failed to fetch room data')
      }
      const roomData = await roomRes.json()
      setRoom(roomData)

      // Then fetch games using the room data
      const gamesRes = await fetch(`/api/showdown/games?sport=${roomData.sport}&date=${roomData.gameDate}`)
      if (!gamesRes.ok) {
        throw new Error('Failed to fetch games data')
      }
      const gamesData = await gamesRes.json()

      setGames(gamesData)

      // Initialize picks array
      const initialPicks = gamesData.map((game: Game) => ({
        gameId: game.id,
        selectedTeam: ''
      }))
      setPicks(initialPicks)
    } catch (err) {
      console.error('Error fetching room data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch room data')
      toast.error('Failed to load room data')
    } finally {
      setLoading(false)
    }
  }

  const handlePickSelection = (gameId: string, team: string) => {
    setPicks(prev => prev.map(pick => 
      pick.gameId === gameId ? { ...pick, selectedTeam: team } : pick
    ))
  }

  const handleSubmitPicks = async () => {
    // Validate all picks are made
    const incompletePicks = picks.filter(pick => !pick.selectedTeam)
    if (incompletePicks.length > 0) {
      toast.error('Please make a pick for all games')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/showdown/rooms/${roomId}/picks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ picks }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit picks')
      }

      toast.success('Picks submitted successfully!')
      // Refresh room data to show updated status
      fetchRoomData()
    } catch (err) {
      console.error('Error submitting picks:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to submit picks')
    } finally {
      setSubmitting(false)
    }
  }

  const handleGradeResults = async () => {
    if (!room || room.creatorId !== session?.user?.id) {
      toast.error('Only room creator can grade results')
      return
    }

    try {
      setSubmitting(true)
      const response = await fetch(`/api/showdown/rooms/${roomId}/grade`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to grade results')
      }

      const result = await response.json()
      toast.success(`Results graded! Winners: ${result.results.winners.join(', ')}`)
      fetchRoomData()
    } catch (err) {
      console.error('Error grading results:', err)
      toast.error(err instanceof Error ? err.message : 'Failed to grade results')
    } finally {
      setSubmitting(false)
    }
  }

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      timeZoneName: 'short'
    })
  }

  const formatOdds = (price: number) => {
    if (price > 0) {
      return `+${price}`
    }
    return price.toString()
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return null
  }

  if (error || !room) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-red-400 text-xl">Error: {error || 'Room not found'}</div>
      </div>
    )
  }

  const isCreator = room.creatorId === session?.user?.id
  const isParticipant = room.participants.some(p => p.user.id === session?.user?.id)
  const canMakePicks = room.status === 'open' && isParticipant
  const canGrade = room.status === 'in_progress' && isCreator

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/showdown')}
            className="text-blue-400 hover:text-blue-300 mb-4 flex items-center"
          >
            ← Back to Showdowns
          </button>
          
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold mb-2">{room.name}</h1>
              <div className="flex items-center space-x-4 text-sm text-gray-400">
                <span>Created by {room.creator.username}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-xs ${
                  room.status === 'open' ? 'bg-green-500/20 text-green-400' :
                  room.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {room.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </span>
                <span>•</span>
                <span>{room.sportTitle}</span>
                <span>•</span>
                <span>{new Date(room.gameDate).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-green-400">
                ${room.entryFee}
              </div>
              <div className="text-sm text-gray-400">Entry Fee</div>
              <div className="text-sm text-gray-400 mt-1">
                {room.participants.length} participant{room.participants.length !== 1 ? 's' : ''}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 flex space-x-4">
          {canMakePicks && (
            <button
              onClick={handleSubmitPicks}
              disabled={submitting || picks.some(p => !p.selectedTeam)}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {submitting ? 'Submitting...' : 'Submit Picks'}
            </button>
          )}
          
          {canGrade && (
            <button
              onClick={handleGradeResults}
              disabled={submitting}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              {submitting ? 'Grading...' : 'Grade Results'}
            </button>
          )}
        </div>

        {/* Games Grid */}
        <div className="grid gap-4">
          {games.map((game) => {
            const pick = picks.find(p => p.gameId === game.id)
            const homeTeamOdds = game.moneyline.find(m => m.name === game.home_team)
            const awayTeamOdds = game.moneyline.find(m => m.name === game.away_team)
            
            return (
              <div
                key={game.id}
                className="bg-gray-800 rounded-lg p-6 border border-gray-700"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">
                      {game.away_team} @ {game.home_team}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {formatTime(game.commence_time)}
                    </p>
                  </div>
                  
                  {room.status === 'completed' && (
                    <div className="text-sm text-gray-400">
                      Results: {game.home_team} vs {game.away_team}
                    </div>
                  )}
                </div>

                {/* Team Selection */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Away Team */}
                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    pick?.selectedTeam === game.away_team
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <button
                      onClick={() => handlePickSelection(game.id, game.away_team)}
                      disabled={!canMakePicks}
                      className="w-full text-left"
                    >
                      <div className="font-semibold text-white mb-1">{game.away_team}</div>
                      {awayTeamOdds && (
                        <div className="text-sm text-gray-400">
                          {formatOdds(awayTeamOdds.price)}
                        </div>
                      )}
                    </button>
                  </div>

                  {/* Home Team */}
                  <div className={`p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    pick?.selectedTeam === game.home_team
                      ? 'border-blue-500 bg-blue-500/10'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}>
                    <button
                      onClick={() => handlePickSelection(game.id, game.home_team)}
                      disabled={!canMakePicks}
                      className="w-full text-left"
                    >
                      <div className="font-semibold text-white mb-1">{game.home_team}</div>
                      {homeTeamOdds && (
                        <div className="text-sm text-gray-400">
                          {formatOdds(homeTeamOdds.price)}
                        </div>
                      )}
                    </button>
                  </div>
                </div>

                {/* Pick Status */}
                {pick?.selectedTeam && (
                  <div className="mt-3 text-center">
                    <span className="text-sm text-gray-400">Your Pick: </span>
                    <span className="text-blue-400 font-semibold">{pick.selectedTeam}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Participants */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Participants</h2>
          <div className="grid gap-2">
            {room.participants.map((participant) => (
              <div
                key={participant.id}
                className="flex justify-between items-center bg-gray-800 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-white font-medium">
                    {participant.user.username}
                  </span>
                  {participant.user.id === room.creatorId && (
                    <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full">
                      Creator
                    </span>
                  )}
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-400">
                    {participant.score}
                  </div>
                  <div className="text-sm text-gray-400">Score</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
} 