import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if room exists and is open
    const room = await prisma.showdownRoom.findUnique({
      where: { id: params.roomId },
      include: {
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
    });

    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    if (room.status !== 'open') {
      return NextResponse.json(
        { error: 'Room is not open for joining' },
        { status: 400 }
      );
    }

    // Check if user is already a participant
    const existingParticipant = room.participants.find(
      p => p.user.id === session.user.id
    );

    if (existingParticipant) {
      return NextResponse.json(
        { error: 'Already a participant in this room' },
        { status: 400 }
      );
    }

    // Check if user has enough balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { balance: true }
    });

    if (!user || user.balance < room.entryFee) {
      return NextResponse.json(
        { error: 'Insufficient balance to join room' },
        { status: 400 }
      );
    }

    // Add user to room and deduct entry fee
    const participant = await prisma.showdownParticipant.create({
      data: {
        userId: session.user.id,
        roomId: params.roomId,
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
    });

    // Deduct entry fee from user's balance
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        balance: {
          decrement: room.entryFee
        }
      }
    });

    return NextResponse.json({
      message: 'Successfully joined room',
      participant
    });
  } catch (error) {
    console.error('Error joining room:', error);
    return NextResponse.json(
      { error: 'Failed to join room' },
      { status: 500 }
    );
  }
} 