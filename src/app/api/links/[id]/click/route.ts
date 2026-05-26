import { NextRequest, NextResponse } from 'next/server'
import { incrementClick } from '@/lib/storage'

// POST - track click (public, no auth needed)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  await incrementClick(params.id)
  return NextResponse.json({ success: true })
}
