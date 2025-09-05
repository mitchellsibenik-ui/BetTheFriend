'use client'

import { useState } from 'react'
import { PlusIcon, MinusIcon } from '@heroicons/react/24/outline'
import PaymentModal from './PaymentModal'

interface BalanceDisplayProps {
  balance: number
  showPaymentButtons?: boolean
  onBalanceUpdate?: (newBalance: number) => void
}

export default function BalanceDisplay({ 
  balance, 
  showPaymentButtons = true, 
  onBalanceUpdate 
}: BalanceDisplayProps) {
  const [showDepositModal, setShowDepositModal] = useState(false)
  const [showWithdrawModal, setShowWithdrawModal] = useState(false)

  const handlePaymentSuccess = (transaction: any) => {
    if (onBalanceUpdate) {
      onBalanceUpdate(transaction.newBalance)
    }
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-300">Account Balance</p>
            <p className="text-2xl font-bold text-white">
              ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
          </div>
          
          {showPaymentButtons && (
            <div className="flex gap-2">
              <button
                onClick={() => setShowDepositModal(true)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <PlusIcon className="w-4 h-4" />
                Add Funds
              </button>
              <button
                onClick={() => setShowWithdrawModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <MinusIcon className="w-4 h-4" />
                Withdraw
              </button>
            </div>
          )}
        </div>
      </div>

      <PaymentModal
        isOpen={showDepositModal}
        onClose={() => setShowDepositModal(false)}
        type="deposit"
        onSuccess={handlePaymentSuccess}
      />

      <PaymentModal
        isOpen={showWithdrawModal}
        onClose={() => setShowWithdrawModal(false)}
        type="withdrawal"
        onSuccess={handlePaymentSuccess}
      />
    </>
  )
}
