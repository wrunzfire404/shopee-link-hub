import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const WAHDX_API_URL = 'https://api.wahdx.com'
const WAHDX_API_KEY = process.env.WAHDX_API_KEY || ''

// GET - test post to Threads with a simple text (no media)
export async function GET(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!WAHDX_API_KEY) {
    return NextResponse.json({ error: 'No WAHDX_API_KEY' }, { status: 500 })
  }

  // First get accounts
  const accRes = await fetch(`${WAHDX_API_URL}/api/content/accounts`, {
    headers: { 'X-API-Key': WAHDX_API_KEY },
  })
  const accData = await accRes.json()
  const threadsAcc = (accData.data || []).find((a: any) => a.platform === 'threads')

  if (!threadsAcc) {
    return NextResponse.json({ error: 'No threads account found', accounts: accData })
  }

  // Test post text-only
  const payload = {
    platform: 'threads',
    accountId: threadsAcc.accountId,
    content: 'Test post from API ' + new Date().toISOString(),
    threadsSettings: { who_can_reply: 'everyone' },
  }

  const res = await fetch(`${WAHDX_API_URL}/api/content/post`, {
    method: 'POST',
    headers: {
      'X-API-Key': WAHDX_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  const responseText = await res.text()

  return NextResponse.json({
    status: res.status,
    headers: Object.fromEntries(res.headers),
    payload,
    response: responseText,
  })
}
