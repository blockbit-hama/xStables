import { NextResponse } from 'next/server'
import { QUOTE_PROVIDERS } from 'shared'

export async function GET() {
  try {
    return NextResponse.json({
      providers: QUOTE_PROVIDERS
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get providers', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}