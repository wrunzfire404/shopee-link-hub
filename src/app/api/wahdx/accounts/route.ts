import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const WAHDX_API_URL = 'https://api.wahdx.com'
const WAHDX_API_KEY = process.env.WAHDX_API_KEY || ''

// GET - list connected Wahdx accounts
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!WAHDX_API_KEY) {
    return NextResponse.json({ error: 'Wahdx API key not configured' }, { status: 500 })
  }

  try {
    const res = await fetch(`${WAHDX_API_URL}/api/content/accounts`, {
      headers: { 'X-API-Key': WAHDX_API_KEY },
    })

    const data = await res.json()
    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: 'Failed to fetch accounts', message: err.message }, { status: 500 })
  }
}
