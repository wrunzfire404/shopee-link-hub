import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const WAHDX_API_URL = 'https://api.wahdx.com'
const WAHDX_API_KEY = process.env.WAHDX_API_KEY || ''

// POST - publish to Threads via Wahdx
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!WAHDX_API_KEY) {
    return NextResponse.json({ error: 'Wahdx API key not configured' }, { status: 500 })
  }

  const { caption, mediaUrls, accountId, scheduleTime } = await request.json()

  if (!caption) {
    return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
  }

  try {
    const payload: any = {
      platform: 'threads',
      accountId: accountId || process.env.WAHDX_THREADS_ACCOUNT_ID || '',
      content: caption,
      threadsSettings: {
        who_can_reply: 'everyone',
      },
    }

    // Add media if provided
    if (mediaUrls && mediaUrls.length > 0) {
      payload.mediaItems = mediaUrls.map((url: string) => ({ url }))
    }

    // Add schedule if provided
    if (scheduleTime) {
      payload.scheduleTime = scheduleTime
    }

    const res = await fetch(`${WAHDX_API_URL}/api/content/post`, {
      method: 'POST',
      headers: {
        'X-API-Key': WAHDX_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })

    const data = await res.json()

    if (!res.ok) {
      return NextResponse.json({ error: 'Wahdx post failed', detail: data }, { status: res.status })
    }

    return NextResponse.json({
      success: true,
      publishId: data.publishId || data.id,
      data,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Post failed', message: err.message }, { status: 500 })
  }
}
