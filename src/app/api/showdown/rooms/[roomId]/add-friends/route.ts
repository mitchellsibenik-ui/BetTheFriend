import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ roomId: string }> | { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const resolvedParams = await Promise.resolve(params)
    const { friendIds } = await request.json()

    if (!Array.isArray(friendIds) || friendIds.length === 0) {
      return NextResponse.json(
        { error: 'Friend IDs are required' },
        { status: 400 }
      )
    }

    // Verify the user is the creator of the room
    const room = await prisma.showdownRoom.findUnique({
      where: { id: resolvedParams.roomId },
      include: { 
        creator: true,
        participants: {
          include: {
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    })

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 })
    }

    if (room.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only room creator can add friends directly' },
        { status: 403 }
      )
    }

    if (room.status !== 'open') {
      return NextResponse.json(
        { error: 'Room is not open for adding friends' },
        { status: 400 }
      )
    }

    // Verify all friendIds are actual friends
    const friendships = await prisma.friendship.findMany({
      where: {
        OR: [
          {
            AND: [
              { senderId: session.user.id },
              { receiverId: { in: friendIds } },
              { status: 'ACCEPTED' }
            ]
          },
          {
            AND: [
              { receiverId: session.user.id },
              { senderId: { in: friendIds } },
              { status: 'ACCEPTED' }
            ]
          }
        ]
      }
    })

    // Extract the friend IDs from the friendships
    const validFriendIds = []
    for (const friendship of friendships) {
      if (friendship.senderId === session.user.id) {
        validFriendIds.push(friendship.receiverId)
      } else if (friendship.receiverId === session.user.id) {
        validFriendIds.push(friendship.senderId)
      }
    }

    if (validFriendIds.length === 0) {
      return NextResponse.json(
        { error: 'No valid friends found' },
        { status: 400 }
      )
    }

    // Filter out friends who are already participants
    const existingParticipantIds = room.participants.map(p => p.userId)
    const friendsToAdd = validFriendIds.filter(friendId => !existingParticipantIds.includes(friendId))

    if (friendsToAdd.length === 0) {
      return NextResponse.json(
        { error: 'All selected friends are already participants' },
        { status: 400 }
      )
    }

    // Check if friends have enough balance
    const friends = await prisma.user.findMany({
      where: { id: { in: friendsToAdd } },
      select: { id: true, username: true, balance: true }
    })

    const friendsWithInsufficientBalance = friends.filter(friend => friend.balance < room.entryFee)
    if (friendsWithInsufficientBalance.length > 0) {
      return NextResponse.json(
        { 
          error: `Some friends have insufficient balance: ${friendsWithInsufficientBalance.map(f => f.username).join(', ')}` 
        },
        { status: 400 }
      )
    }

    // Add friends to room and deduct entry fees
    const addedParticipants = await prisma.$transaction(async (tx) => {
      // Deduct entry fees from friends' balances
      await tx.user.updateMany({
        where: { id: { in: friendsToAdd } },
        data: { balance: { decrement: room.entryFee } }
      })

      // Add friends as participants
      const participants = await Promise.all(
        friendsToAdd.map(friendId =>
          tx.showdownParticipant.create({
            data: {
              userId: friendId,
              roomId: resolvedParams.roomId,
              score: 0
            },
            include: {
              user: {
                select: {
                  id: true,
                  username: true
                }
              }
            }
          })
        )
      )

      return participants
    })

    return NextResponse.json({
      message: `Successfully added ${addedParticipants.length} friends to the showdown`,
      addedCount: addedParticipants.length,
      addedParticipants: addedParticipants.map(p => ({
        id: p.id,
        username: p.user.username
      }))
    })
  } catch (error) {
    console.error('Error adding friends to room:', error)
    return NextResponse.json(
      { error: 'Failed to add friends to room' },
      { status: 500 }
    )
  }
}

