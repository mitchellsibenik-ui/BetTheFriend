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
    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { picks } = await request.json();

    // Validate picks
    if (!Array.isArray(picks)) {
      return new NextResponse('Invalid picks format', { status: 400 });
    }

    // Get or create participant
    const participant = await prisma.showdownParticipant.upsert({
      where: {
        userId_roomId: {
          userId: session.user.id,
          roomId: params.roomId,
        },
      },
      create: {
        userId: session.user.id,
        roomId: params.roomId,
        score: 0,
      },
      update: {},
    });

    // Create picks in the database
    const createdPicks = await Promise.all(
      picks.map((pick) =>
        prisma.showdownPick.create({
          data: {
            participantId: participant.id,
            gameId: pick.gameId,
            selectedTeam: pick.selectedTeam,
            type: 'moneyline'
          },
        })
      )
    );

    return NextResponse.json(createdPicks);
  } catch (error) {
    console.error('Error creating picks:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 