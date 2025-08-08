import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { verify } from 'jsonwebtoken'

export async function GET(req: Request) {
  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let userId: number
    try {
      const decoded = verify(token, process.env.JWT_SECRET!) as { userId: number }
      userId = decoded.userId
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    // Fetch both sent and received pending wagers
    const [sentWagers, receivedWagers] = await Promise.all([
      prisma.wager.findMany({
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
      }),
      prisma.wager.findMany({
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
    ])

    return NextResponse.json({
      sentWagers,
      receivedWagers
    })
  } catch (error) {
    console.error('Error fetching pending wagers:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 