import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST - upload image file (uses Imgur anonymous upload)
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (file.type.startsWith('video/')) {
      return NextResponse.json({ error: 'Video: paste direct URL (Google Drive/Dropbox)' }, { status: 422 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images supported' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 10MB' }, { status: 400 })
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Upload to Imgur (anonymous, keeps original quality & aspect ratio)
    const res = await fetch('https://api.imgur.com/3/image', {
      method: 'POST',
      headers: {
        'Authorization': 'Client-ID 546c25a59c58ad7',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: base64,
        type: 'base64',
      }),
    })

    const data = await res.json()

    if (data.success && data.data?.link) {
      return NextResponse.json({ url: data.data.link })
    }

    // Fallback to freeimage.host
    const params = new URLSearchParams()
    params.append('key', '6d207e02198a847aa98d0a2a901485a5')
    params.append('action', 'upload')
    params.append('source', base64)
    params.append('format', 'json')

    const fallbackRes = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const fallbackData = await fallbackRes.json()
    if (fallbackData.status_code === 200 && fallbackData.image?.url) {
      return NextResponse.json({ url: fallbackData.image.url })
    }

    return NextResponse.json({ error: 'Upload failed', detail: data.data?.error || 'All hosts rejected' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Upload error', message: err.message }, { status: 500 })
  }
}
