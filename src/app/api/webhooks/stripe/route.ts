import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('stripe-signature')!

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentIntentSucceeded(event.data.object as Stripe.PaymentIntent)
        break
      case 'payment_intent.payment_failed':
        await handlePaymentIntentFailed(event.data.object as Stripe.PaymentIntent)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

async function handlePaymentIntentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  try {
    const { userId, type } = paymentIntent.metadata

    if (!userId || !type) {
      console.error('Missing metadata in payment intent:', paymentIntent.id)
      return
    }

    // Update transaction status
    await prisma.paymentTransaction.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: 'succeeded' },
    })

    // Update user balance
    const amount = paymentIntent.amount / 100 // Convert from cents
    const isDeposit = type === 'deposit'

    await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { balance: true }
      })

      if (!user) {
        throw new Error('User not found')
      }

      const previousBalance = user.balance
      const newBalance = isDeposit 
        ? previousBalance + amount 
        : previousBalance - amount

      // Update balance
      await tx.user.update({
        where: { id: userId },
        data: { balance: newBalance },
      })

      // Record balance history
      await tx.balanceHistory.create({
        data: {
          userId: userId,
          previousBalance: previousBalance,
          newBalance: newBalance,
          changeAmount: isDeposit ? amount : -amount,
          reason: isDeposit ? 'deposit' : 'withdrawal',
          transactionId: paymentIntent.id,
          description: `${isDeposit ? 'Deposit' : 'Withdrawal'} of $${amount}`,
        },
      })
    })

    console.log(`Payment succeeded for user ${userId}: ${type} $${amount}`)
  } catch (error) {
    console.error('Error handling payment intent succeeded:', error)
  }
}

async function handlePaymentIntentFailed(paymentIntent: Stripe.PaymentIntent) {
  try {
    // Update transaction status
    await prisma.paymentTransaction.updateMany({
      where: { stripePaymentIntentId: paymentIntent.id },
      data: { status: 'failed' },
    })

    console.log(`Payment failed for payment intent: ${paymentIntent.id}`)
  } catch (error) {
    console.error('Error handling payment intent failed:', error)
  }
}
