import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: Request,
  { params }: { params: { roomId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { roomId } = params

    // Verify user is the creator of this room
    const room = await prisma.showdownRoom.findUnique({
      where: { id: roomId },
      include: {
        sport: true,
        gameDate: true,
        participants: {
          include: {
            picks: true,
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

    if (!room || room.creatorId !== session.user.id) {
      return NextResponse.json(
        { error: 'Only room creator can grade results' },
        { status: 403 }
      )
    }

    if (room.status !== 'in_progress') {
      return NextResponse.json(
        { error: 'Room must be in progress to grade results' },
        { status: 400 }
      )
    }

    // Fetch game results from The Odds API
    const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    // Get unique game IDs from all picks
    const gameIds = Array.from(new Set(room.participants.flatMap(p => p.picks.map(pick => pick.gameId))))

    // Fetch results for each game
    const gameResults = await Promise.all(
      gameIds.map(async (gameId) => {
        try {
          const response = await fetch(
            `https://api.the-odds-api.com/v4/sports/${room.sport}/scores?apiKey=${apiKey}&date=${room.gameDate}`,
            { cache: 'no-store' }
          )
          
          if (!response.ok) return null
          
          const games = await response.json()
          const game = games.find((g: any) => g.id === gameId)
          
          if (!game) return null
          
          return {
            gameId,
            homeScore: game.scores?.[0] || 0,
            awayScore: game.scores?.[1] || 0,
            winner: game.scores?.[0] > game.scores?.[1] ? game.home_team : game.away_team
          }
        } catch (error) {
          console.error(`Error fetching result for game ${gameId}:`, error)
          return null
        }
      })
    )

    // Grade each participant's picks
    const gradedParticipants = room.participants.map(participant => {
      let correctPicks = 0
      const gradedPicks = participant.picks.map(pick => {
        const gameResult = gameResults.find(r => r?.gameId === pick.gameId)
        if (!gameResult) return { ...pick, isCorrect: null }
        
        const isCorrect = pick.selectedTeam === gameResult.winner
        if (isCorrect) correctPicks++
        
        return { ...pick, isCorrect }
      })
      
      return {
        ...participant,
        picks: gradedPicks,
        score: correctPicks
      }
    })

    // Determine winner(s) - highest score wins
    const maxScore = Math.max(...gradedParticipants.map(p => p.score))
    const winners = gradedParticipants.filter(p => p.score === maxScore)
    
    // Calculate pot and winnings
    const totalPot = room.entryFee * room.participants.length
    const winningsPerWinner = totalPot / winners.length

    // Update database with results
    await prisma.$transaction(async (tx) => {
      // Update room status
      await tx.showdownRoom.update({
        where: { id: roomId },
        data: { status: 'completed' }
      })

      // Update participant scores and picks
      for (const participant of gradedParticipants) {
        await tx.showdownParticipant.update({
          where: { id: participant.id },
          data: { score: participant.score }
        })

        // Update picks with correct/incorrect status
        for (const pick of participant.picks) {
          if (pick.isCorrect !== null) {
            await tx.showdownPick.update({
              where: { id: pick.id },
              data: { isCorrect: pick.isCorrect }
            })
          }
        }
      }

      // Award winnings to winners
      for (const winner of winners) {
        await tx.user.update({
          where: { id: winner.user.id },
          data: { balance: { increment: winningsPerWinner } }
        })
      }
    })

    return NextResponse.json({
      success: true,
      results: {
        participants: gradedParticipants,
        winners: winners.map(w => w.user.username),
        totalPot,
        winningsPerWinner
      }
    })
  } catch (error) {
    console.error('Error grading showdown:', error)
    return NextResponse.json(
      { error: 'Failed to grade showdown' },
      { status: 500 }
    )
  }
} 