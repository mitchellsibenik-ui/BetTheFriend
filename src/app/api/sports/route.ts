import { NextResponse } from 'next/server'
import axios from 'axios'

const API_KEY = process.env.NEXT_PUBLIC_ODDS_API_KEY
const BASE_URL = 'https://api.the-odds-api.com/v4'

export async function GET() {
  try {
    const response = await axios.get(`${BASE_URL}/sports/icehockey_nhl/odds`, {
      params: {
        apiKey: API_KEY,
        regions: 'us',
        markets: 'h2h,spreads,totals',
        oddsFormat: 'american'
      }
    })

    return NextResponse.json(response.data)
  } catch (error: any) {
    console.error('API Error details:', {
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    })

    // Handle quota exceeded error
    if (error.response?.status === 401 && error.response?.data?.error_code === 'OUT_OF_USAGE_CREDITS') {
      return NextResponse.json(
        { error: 'API quota exceeded. Please try again later.' },
        { status: 429 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      { error: 'Failed to fetch sports data' },
      { status: error.response?.status || 500 }
    )
  }
} 