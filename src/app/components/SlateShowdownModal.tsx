import { useState } from 'react'
import { Event } from '../types'
import { MOCK_FRIENDS } from '../data/mockData'

type Slate = {
  id: string;
  name: string;
  sport: string;
  date: string;
  games: Event[];
  status: 'open' | 'closed' | 'in_progress';
  participants?: {
    username: string;
    picks: SlatePick[];
    score?: number;
  }[];
}

type SlatePick = {
  gameId: string;
  team: string;
  odds: string;
}

type User = {
  id: number;
  username: string;
  avatar: string;
}

type Friend = {
  id: number;
  username: string;
  avatar: string;
  totalBets: number;
  wins: number;
  losses: number;
  profit: number;
  streak: number;
  favoriteSport: string;
  status: 'online' | 'offline';
  lastActive: string;
  recentActivity: {
    type: 'win' | 'loss';
    amount: number;
    game: string;
    opponent: string;
  }[];
}

type SlateChallenge = {
  id: string;
  slate: Slate;
  challenger: User;
  opponent: Friend;
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: string;
}

type Props = {
  open: boolean;
  onClose: () => void;
  slate: Slate;
  onChallenge: (challenge: SlateChallenge) => void;
}

export default function SlateShowdownModal({ open, onClose, slate, onChallenge }: Props) {
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null)
  const [amount, setAmount] = useState<string>('')
  const [message, setMessage] = useState<string>('')
  const [picks, setPicks] = useState<Record<string, string>>({})
  const [error, setError] = useState<string>('')

  const handleSubmit = () => {
    if (!selectedFriend) {
      setError('Please select a friend to challenge')
      return
    }

    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid wager amount')
      return
    }

    if (Object.keys(picks).length !== slate.games.length) {
      setError('Please make a pick for each game')
      return
    }

    const challenge: SlateChallenge = {
      id: Math.random().toString(36).substr(2, 9),
      slate,
      challenger: {
        id: 1,
        username: 'CurrentUser',
        avatar: '/avatars/user.png'
      },
      opponent: selectedFriend,
      status: 'pending',
      createdAt: new Date().toISOString()
    }

    onChallenge(challenge)
    onClose()
  }

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 ${open ? '' : 'hidden'}`}>
      <div className="bg-gray-900 rounded-xl p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Challenge Friend</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Friend
            </label>
            <select
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
              value={selectedFriend?.id || ''}
              onChange={(e) => {
                const friend = MOCK_FRIENDS.find(f => f.id === Number(e.target.value))
                setSelectedFriend(friend || null)
              }}
            >
              <option value="">Choose a friend...</option>
              {MOCK_FRIENDS.map((friend) => (
                <option key={friend.id} value={friend.id}>
                  {friend.username} ({friend.status})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Wager Amount ($)
            </label>
            <input
              type="number"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount..."
              min="1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Trash Talk (Optional)
            </label>
            <textarea
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 transition"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add some friendly banter..."
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Make Your Picks
            </label>
            <div className="space-y-3">
              {slate.games.map((game) => (
                <div key={game.id} className="bg-gray-800 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-white font-medium">
                      {game.teams[0]} vs {game.teams[1]}
                    </span>
                    <span className="text-sm text-gray-400">{game.time}</span>
                  </div>
                  <div className="flex gap-2">
                    {game.teams.map((team) => (
                      <button
                        key={team}
                        onClick={() => setPicks({ ...picks, [game.id]: team })}
                        className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
                          picks[game.id] === team
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {team} ({game.odds[team]})
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              Send Challenge
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 