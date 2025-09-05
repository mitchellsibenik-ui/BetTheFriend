import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { amount, type } = await request.json()

    // Validate amount
    if (!amount || amount < 1 || amount > 10000) {
      return NextResponse.json(
        { error: 'Amount must be between $1 and $10,000' },
        { status: 400 }
      )
    }

    // Validate type
    if (!type || !['deposit', 'withdrawal'].includes(type)) {
      return NextResponse.json(
        { error: 'Type must be deposit or withdrawal' },
        { status: 400 }
      )
    }

    // For withdrawals, check if user has sufficient balance
    if (type === 'withdrawal') {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true }
      })

      if (!user || user.balance < amount) {
        return NextResponse.json(
          { error: 'Insufficient balance for withdrawal' },
          { status: 400 }
        )
      }
    }

    // Check if Stripe is available
    if (!stripe) {
      return NextResponse.json(
        { error: 'Payment processing is not available at this time' },
        { status: 503 }
      )
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId: session.user.id,
        type: type,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    // Create transaction record
    const transaction = await prisma.paymentTransaction.create({
      data: {
        userId: session.user.id,
        type: type,
        amount: amount,
        stripePaymentIntentId: paymentIntent.id,
        status: 'pending',
        description: `${type === 'deposit' ? 'Deposit' : 'Withdrawal'} of $${amount}`,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
    })
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
