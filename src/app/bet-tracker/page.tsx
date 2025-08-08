'use client'

import { useState } from 'react'
import WagerModal from '@/components/WagerModal'

const MOCK_BETS = [
  {
    id: 1,
    status: 'Active',
    opponent: 'JohnDoe',
    result: null,
    message: "You're crazy if you think the Eagles cover.",
    finalScore: null,
    date: '2024-04-20T19:30:00Z',
    gif: 'https://media.giphy.com/media/3o6Zt6ML6BklcajjsA/giphy.gif',
    game: 'Eagles vs Cowboys',
  },
  {
    id: 2,
    status: 'Pending',
    opponent: 'SarahJones',
    result: null,
    message: "Let's see if your Lakers can actually win.",
    finalScore: null,
    date: '2024-04-19T21:00:00Z',
    gif: '',
    game: 'Lakers vs Celtics',
  },
  {
    id: 3,
    status: 'Completed',
    opponent: 'MikeSmith',
    result: 'Win',
    message: "Told you the Yankees would crush it!",
    finalScore: 'Yankees 7 - Red Sox 2',
    date: '2024-04-15T18:00:00Z',
    gif: 'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
    game: 'Yankees vs Red Sox',
  },
  {
    id: 4,
    status: 'Archived',
    opponent: 'AlexJohnson',
    result: 'Loss',
    message: "Next time, I'm picking the underdog.",
    finalScore: 'Bears 10 - Packers 24',
    date: '2024-03-10T16:00:00Z',
    gif: '',
    game: 'Bears vs Packers',
  },
]

const TABS = ['Active', 'Pending', 'Completed', 'Archived']

function BetCard({ bet }: any) {
  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-lg border border-gray-700 p-6 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-white font-bold">{bet.game}</div>
          <span className="px-2 py-1 text-xs rounded-full bg-blue-600/20 text-blue-400">{bet.status}</span>
        </div>
        <div className="text-sm text-gray-400">{new Date(bet.date).toLocaleDateString()}</div>
      </div>
      <div className="flex items-center gap-2 text-gray-300 text-sm">
        <span>vs <span className="font-semibold text-blue-300">{bet.opponent}</span></span>
        {bet.result && (
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${bet.result === 'Win' ? 'bg-green-600/20 text-green-400' : 'bg-red-600/20 text-red-400'}`}>
            {bet.result}
          </span>
        )}
      </div>
      <div className="text-gray-200 italic">"{bet.message}"</div>
      {bet.gif && (
        <div className="flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bet.gif} alt="GIF" className="max-h-32 rounded-lg border border-gray-700" />
        </div>
      )}
      {bet.finalScore && (
        <div className="text-gray-400 text-sm">Final Score: <span className="font-semibold text-white">{bet.finalScore}</span></div>
      )}
    </div>
  )
}

export default function BetTrackerPage() {
  const [tab, setTab] = useState('Active')

  const filteredBets = MOCK_BETS.filter(bet => bet.status === tab)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-4xl font-bold text-white mb-8 flex items-center gap-3">
          📊 Bet Tracker
        </h1>
        <div className="flex gap-2 mb-8">
          {TABS.map(t => (
            <button
              key={t}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                tab === t
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
              onClick={() => setTab(t)}
            >
              {t}
            </button>
          ))}
        </div>
        <div className="space-y-6">
          {filteredBets.length === 0 ? (
            <div className="text-gray-400 text-center py-12">No bets in this category yet.</div>
          ) : (
            filteredBets.map(bet => <BetCard key={bet.id} bet={bet} />)
          )}
        </div>
      </div>
    </div>
  )
} 