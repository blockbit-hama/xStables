import { NextRequest, NextResponse } from 'next/server'
import { QuoteRequestSchema } from 'shared'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const quoteRequest = QuoteRequestSchema.parse(body)

    // Forward request to backend API
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
    const response = await fetch(`${backendUrl}/api/quote`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(quoteRequest),
    })

    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Quote API error:', error)
    return NextResponse.json(
      { error: 'Failed to get quote', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}