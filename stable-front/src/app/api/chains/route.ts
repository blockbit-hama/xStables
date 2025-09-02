import { NextResponse } from 'next/server'
import { SUPPORTED_CHAINS } from 'shared'

export async function GET() {
  try {
    return NextResponse.json({
      chains: SUPPORTED_CHAINS
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get chains', message: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}