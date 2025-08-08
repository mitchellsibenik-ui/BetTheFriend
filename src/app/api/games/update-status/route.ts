import { NextResponse } from 'next/server'
import { oddsApi } from '@/lib/api/odds'

export async function POST() {
  try {
    await oddsApi.updateGameStatuses()
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating game statuses:', error)
    return NextResponse.json(
      { error: 'Failed to update game statuses' },
      { status: 500 }
    )
  }
} 