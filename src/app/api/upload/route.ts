import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

// Free imgbb API key (public, 32MB limit per image)
const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '367e08a72ed929e71be498f74c02cbe7'

// Allow larger uploads (up to 10MB)
export const maxDuration = 30

export const runtime = 'nodejs'

// POST - upload file
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
      return NextResponse.json({ error: 'Video upload: paste a direct video URL instead (e.g. from Google Drive or Dropbox)' }, { status: 422 })
    }

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only images are supported for upload' }, { status: 400 })
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 })
    }

    // Convert to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Upload to imgbb using URLSearchParams (most compatible)
    const params = new URLSearchParams()
    params.append('key', IMGBB_API_KEY)
    params.append('image', base64)

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    const data = await res.json()

    if (!res.ok || !data.success) {
      console.error('imgbb response:', JSON.stringify(data))
      return NextResponse.json(
        { error: 'Image host rejected the upload', detail: data.error?.message || 'Unknown error' },
        { status: 500 }
      )
    }

    return NextResponse.json({ url: data.data.display_url || data.data.url })
  } catch (err: any) {
    console.error('Upload exception:', err)
    return NextResponse.json({ error: 'Upload failed', message: err.message }, { status: 500 })
  }
}
