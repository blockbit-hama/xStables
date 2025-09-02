import { NextResponse } from 'next/server'
import { SUPPORTED_TOKENS } from 'shared'

export async function GET() {
  try {
    return NextResponse.json({
      tokens: SUPPORTED_TOKENS
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get tokens', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}