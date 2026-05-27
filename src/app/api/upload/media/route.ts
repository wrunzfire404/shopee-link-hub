import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST - upload media for Threads posting (Imgur - public URL, proper extension, Wahdx compatible)
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

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images supported. For video use direct URL.' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

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
      // Imgur returns URL like https://i.imgur.com/abc.png - Wahdx compatible
      return NextResponse.json({ url: data.data.link })
    }

    return NextResponse.json({ error: 'Upload failed', detail: data.data?.error || 'Imgur rejected' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Upload error', message: err.message }, { status: 500 })
  }
}
