import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET /api/chat/rooms/[roomId]/messages - Get messages for a chat room
export async function GET(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params

    // Verify user has access to this room
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    const messages = await prisma.chatMessage.findMany({
      where: { roomId },
      include: {
        sender: {
          select: { id: true, username: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/chat/rooms/[roomId]/messages - Send a message to a chat room
export async function POST(
  request: NextRequest,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params
    const { message } = await request.json()

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

    // Verify user has access to this room
    const room = await prisma.chatRoom.findFirst({
      where: {
        id: roomId,
        OR: [
          { user1Id: session.user.id },
          { user2Id: session.user.id }
        ]
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    // Create the message
    const newMessage = await prisma.chatMessage.create({
      data: {
        roomId,
        senderId: session.user.id,
        message: message.trim()
      },
      include: {
        sender: {
          select: { id: true, username: true }
        }
      }
    })

    // Mark the message as read for the sender
    await prisma.chatReadStatus.create({
      data: {
        messageId: newMessage.id,
        userId: session.user.id
      }
    })

    // Update room's updatedAt timestamp
    await prisma.chatRoom.update({
      where: { id: roomId },
      data: { updatedAt: new Date() }
    })

    return NextResponse.json({ message: newMessage })
  } catch (error) {
    console.error('Error sending message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
