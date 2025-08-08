import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { notificationId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json() // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "accept" or "decline"' },
        { status: 400 }
      )
    }

    // Get the notification
    const notification = await prisma.notification.findUnique({
      where: { id: params.notificationId }
    })

    if (!notification) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 })
    }

    if (notification.userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    if (notification.type !== 'room_invite') {
      return NextResponse.json(
        { error: 'Invalid notification type' },
        { status: 400 }
      )
    }

    // Parse the notification data
    const inviteData = JSON.parse(notification.data || '{}')
    const { roomId, roomName, creatorUsername, entryFee } = inviteData

    if (action === 'accept') {
      // Check if user has enough balance
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true }
      })

      if (!user || user.balance < entryFee) {
        return NextResponse.json(
          { error: 'Insufficient balance to join showdown' },
          { status: 400 }
        )
      }

      // Check if room is still open
      const room = await prisma.showdownRoom.findUnique({
        where: { id: roomId }
      })

      if (!room || room.status !== 'open') {
        return NextResponse.json(
          { error: 'Showdown is no longer open for joining' },
          { status: 400 }
        )
      }

      // Check if user is already a participant
      const existingParticipant = await prisma.showdownParticipant.findUnique({
        where: {
          userId_roomId: {
            userId: session.user.id,
            roomId: roomId
          }
        }
      })

      if (existingParticipant) {
        return NextResponse.json(
          { error: 'Already a participant in this showdown' },
          { status: 400 }
        )
      }

      // Add user to showdown and deduct entry fee
      await prisma.$transaction([
        prisma.showdownParticipant.create({
          data: {
            userId: session.user.id,
            roomId: roomId,
            score: 0
          }
        }),
        prisma.user.update({
          where: { id: session.user.id },
          data: {
            balance: {
              decrement: entryFee
            }
          }
        })
      ])

      // Delete the notification completely
      await prisma.notification.delete({
        where: { id: params.notificationId }
      })

      return NextResponse.json({
        message: 'Successfully joined showdown',
        roomId: roomId
      })
    } else {
      // Decline - delete the notification completely
      await prisma.notification.delete({
        where: { id: params.notificationId }
      })

      return NextResponse.json({
        message: 'Invitation declined'
      })
    }
  } catch (error) {
    console.error('Error responding to invitation:', error)
    return NextResponse.json(
      { error: 'Failed to respond to invitation' },
      { status: 500 }
    )
  }
} 