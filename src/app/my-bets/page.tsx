'use client'

import { useState } from 'react'
import PendingBets from '@/components/PendingBets'
import ActiveBets from '@/components/ActiveBets'
import SettledBets from '@/components/SettledBets'

type Tab = 'pending' | 'active' | 'settled'

export default function MyBetsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('pending')

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-white">My Bets</h1>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-700 mb-8">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('pending')}
              className={`${
                activeTab === 'pending'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Pending
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`${
                activeTab === 'active'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Active
            </button>
            <button
              onClick={() => setActiveTab('settled')}
              className={`${
                activeTab === 'settled'
                  ? 'border-blue-500 text-blue-500'
                  : 'border-transparent text-gray-400 hover:text-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Settled
            </button>
          </nav>
        </div>

        {/* Content */}
        <div>
          {activeTab === 'pending' && <PendingBets />}
          {activeTab === 'active' && <ActiveBets />}
          {activeTab === 'settled' && <SettledBets />}
        </div>
      </div>
    </div>
  )
} 