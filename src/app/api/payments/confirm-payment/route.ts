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

    const { paymentIntentId, transactionId } = await request.json()

    if (!paymentIntentId || !transactionId) {
      return NextResponse.json(
        { error: 'Payment intent ID and transaction ID are required' },
        { status: 400 }
      )
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)

    if (paymentIntent.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Payment not completed' },
        { status: 400 }
      )
    }

    // Update transaction status
    const transaction = await prisma.paymentTransaction.update({
      where: { id: transactionId },
      data: { status: 'succeeded' },
    })

    // Update user balance
    const amount = transaction.amount
    const isDeposit = transaction.type === 'deposit'

    const updatedUser = await prisma.$transaction(async (tx) => {
      // Get current balance
      const user = await tx.user.findUnique({
        where: { id: session.user.id },
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
      const updatedUser = await tx.user.update({
        where: { id: session.user.id },
        data: { balance: newBalance },
      })

      // Record balance history
      await tx.balanceHistory.create({
        data: {
          userId: session.user.id,
          previousBalance: previousBalance,
          newBalance: newBalance,
          changeAmount: isDeposit ? amount : -amount,
          reason: isDeposit ? 'deposit' : 'withdrawal',
          transactionId: transaction.id,
          description: transaction.description,
        },
      })

      return updatedUser
    })

    return NextResponse.json({
      success: true,
      newBalance: updatedUser.balance,
      transaction: transaction,
    })
  } catch (error) {
    console.error('Error confirming payment:', error)
    return NextResponse.json(
      { error: 'Failed to confirm payment' },
      { status: 500 }
    )
  }
}
