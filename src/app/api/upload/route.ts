import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST - upload image for product links (thumbnail, crop OK)
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file || !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Image file required' }, { status: 400 })
    }
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 10MB' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // freeimage.host (for thumbnails, crop OK)
    const params = new URLSearchParams()
    params.append('key', '6d207e02198a847aa98d0a2a901485a5')
    params.append('action', 'upload')
    params.append('source', base64)
    params.append('format', 'json')

    const res = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })
    const data = await res.json()

    if (data.status_code === 200 && data.image?.url) {
      return NextResponse.json({ url: data.image.url })
    }

    return NextResponse.json({ error: 'Upload failed', detail: data.status_txt || 'Unknown' }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Upload error', message: err.message }, { status: 500 })
  }
}
