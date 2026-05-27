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

  const { caption, mediaUrls, accountId, platform, scheduleTime } = await request.json()

  if (!caption) {
    return NextResponse.json({ error: 'Caption is required' }, { status: 400 })
  }

  if (!accountId) {
    return NextResponse.json({ error: 'Account ID is required' }, { status: 400 })
  }

  try {
    const platformName = platform || 'threads'

    const payload: any = {
      platform: platformName,
      accountId,
      content: caption,
    }

    // Platform-specific settings
    if (platformName === 'threads') {
      payload.threadsSettings = { who_can_reply: 'everyone' }
    } else if (platformName === 'instagram') {
      payload.instagramSettings = {}
    } else if (platformName === 'tiktok') {
      payload.tiktokSettings = { privacy_level: 'PUBLIC_TO_EVERYONE', allow_comment: true, auto_add_music: true }
    } else if (platformName === 'facebook') {
      payload.facebookSettings = {}
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

    const responseText = await res.text()
    let data: any
    try { data = JSON.parse(responseText) } catch { data = { raw: responseText } }

    if (!res.ok) {
      return NextResponse.json({
        error: 'Wahdx post failed',
        status: res.status,
        detail: data,
        payload: { ...payload, content: payload.content?.slice(0, 50) + '...' }
      }, { status: res.status })
    }

    return NextResponse.json({
      success: true,
      publishId: data.publishId || data.id,
      data,
    })
  } catch (err: any) {
    return NextResponse.json({ error: 'Post failed', message: err.message, stack: err.stack?.slice(0, 200) }, { status: 500 })
  }
}
