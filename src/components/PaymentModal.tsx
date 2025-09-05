'use client'

import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { XMarkIcon } from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface PaymentModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'deposit' | 'withdrawal'
  onSuccess: (transaction: any) => void
}

function PaymentForm({ type, onSuccess, onClose }: Omit<PaymentModalProps, 'isOpen'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [amount, setAmount] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [clientSecret, setClientSecret] = useState('')

  useEffect(() => {
    if (amount && parseFloat(amount) >= 1) {
      createPaymentIntent()
    }
  }, [amount])

  const createPaymentIntent = async () => {
    try {
      const response = await fetch('/api/payments/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          type: type,
        }),
      })

      const data = await response.json()
      if (data.clientSecret) {
        setClientSecret(data.clientSecret)
      } else {
        toast.error(data.error || 'Failed to create payment intent')
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      toast.error('Failed to create payment intent')
    }
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin,
        },
        redirect: 'if_required',
      })

      if (error) {
        toast.error(error.message || 'Payment failed')
      } else if (paymentIntent.status === 'succeeded') {
        // Confirm payment on our backend
        const confirmResponse = await fetch('/api/payments/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            paymentIntentId: paymentIntent.id,
            transactionId: paymentIntent.metadata.transactionId,
          }),
        })

        const confirmData = await confirmResponse.json()
        if (confirmData.success) {
          toast.success(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} successful!`)
          onSuccess(confirmData.transaction)
          onClose()
        } else {
          toast.error(confirmData.error || 'Failed to confirm payment')
        }
      }
    } catch (error) {
      console.error('Payment error:', error)
      toast.error('Payment failed')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Amount (USD)
        </label>
        <input
          type="number"
          min="1"
          max="10000"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter amount"
          required
        />
        <p className="text-xs text-gray-400 mt-1">
          Minimum: $1.00, Maximum: $10,000.00
        </p>
      </div>

      {clientSecret && (
        <div className="space-y-4">
          <PaymentElement />
          <button
            type="submit"
            disabled={!stripe || isProcessing}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? 'Processing...' : `${type === 'deposit' ? 'Deposit' : 'Withdraw'} $${amount}`}
          </button>
        </div>
      )}
    </form>
  )
}

export default function PaymentModal({ isOpen, onClose, type, onSuccess }: PaymentModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 w-full max-w-md mx-4 border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">
            {type === 'deposit' ? 'Add Funds' : 'Withdraw Funds'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <Elements stripe={stripePromise}>
          <PaymentForm type={type} onSuccess={onSuccess} onClose={onClose} />
        </Elements>
      </div>
    </div>
  )
}
