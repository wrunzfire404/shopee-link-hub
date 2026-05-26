import { NextRequest, NextResponse } from 'next/server'
import { incrementClick } from '@/lib/storage'

// POST - track click (public, no auth)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url)
  const platform = searchParams.get('platform') || undefined
  await incrementClick(params.id, platform)
  return NextResponse.json({ success: true })
}
