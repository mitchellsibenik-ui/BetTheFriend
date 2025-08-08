import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect()
    
    // Try a simple query
    const userCount = await prisma.user.count()
    
    return NextResponse.json({
      status: 'success',
      message: 'Database connection successful',
      userCount
    })
  } catch (error) {
    console.error('Test endpoint error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    return NextResponse.json({
      status: 'error',
      message: errorMessage,
      stack: errorStack
    }, { status: 500 })
  }
} 