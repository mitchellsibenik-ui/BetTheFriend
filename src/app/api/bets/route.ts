import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { authOptions } from '@/lib/auth'

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    if (!status) {
      return NextResponse.json({ error: 'Status parameter is required' }, { status: 400 })
    }

    const userId = parseInt(session.user.id)

    // Fetch bets based on status
    let bets
    if (status === 'pending') {
      // Get bets where user is the sender and status is PENDING
      bets = await prisma.bet.findMany({
        where: {
          senderId: userId,
          status: 'PENDING'
        },
        include: {
          receiver: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (status === 'incoming') {
      // Get bets where user is the receiver and status is PENDING
      bets = await prisma.bet.findMany({
        where: {
          receiverId: userId,
          status: 'PENDING'
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (status === 'active') {
      // Get bets where user is either sender or receiver and status is ACCEPTED
      bets = await prisma.bet.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          status: 'ACCEPTED'
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true
            }
          },
          receiver: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    } else if (status === 'settled') {
      // Get bets where user is either sender or receiver and status is SETTLED
      bets = await prisma.bet.findMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId }
          ],
          status: 'SETTLED'
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true
            }
          },
          receiver: {
            select: {
              id: true,
              username: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    }

    // Transform the bets to match the frontend interface
    const transformedBets = bets.map(bet => ({
      id: bet.id.toString(),
      type: 'single',
      status: bet.status.toLowerCase(),
      amount: bet.amount,
      potentialWin: bet.amount * 2, // Assuming even odds for now
      createdAt: bet.createdAt.toISOString(),
      game: {
        teams: [JSON.parse(bet.gameDetails).homeTeam, JSON.parse(bet.gameDetails).awayTeam],
        time: new Date(JSON.parse(bet.gameDetails).startTime).toLocaleString(),
        betType: bet.betType,
        value: bet.senderValue
      },
      opponent: {
        id: bet.senderId === userId ? bet.receiver.id : bet.sender.id,
        username: bet.senderId === userId ? bet.receiver.username : bet.sender.username
      }
    }))

    return NextResponse.json({ bets: transformedBets })
  } catch (error) {
    console.error('Error fetching bets:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bets' },
      { status: 500 }
    )
  }
} 