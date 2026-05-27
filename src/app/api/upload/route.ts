import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST - upload image (uses Imgur, keeps original, no crop)
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file' }, { status: 400 })
    }

    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Image or video only' }, { status: 400 })
    }

    if (file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Video: use direct URL (Google Drive / Dropbox public link)' }, { status: 422 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Imgur anonymous upload - keeps original quality & aspect ratio
    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image: base64, type: 'base64' }),
    })

    const data = await res.json()

    if (data.success && data.data?.link) {
      return NextResponse.json({ url: data.data.link })
    }

    return NextResponse.json({ error: 'Upload failed', detail: data.data?.error || 'Rejected' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Upload error', message: err.message }, { status: 500 })
  }
}
