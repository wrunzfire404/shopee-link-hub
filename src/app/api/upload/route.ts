import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 30

// POST - upload image file
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
      return NextResponse.json({ error: 'Video: paste direct URL instead (Google Drive, Dropbox)' }, { status: 422 })
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

    // Try freeimage.host (no API key needed, use default key "6d207e02198a847aa98d0a2a901485a5")
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

    // Fallback: try imgbb with environment key
    const imgbbKey = process.env.IMGBB_API_KEY
    if (imgbbKey) {
      const imgbbParams = new URLSearchParams()
      imgbbParams.append('key', imgbbKey)
      imgbbParams.append('image', base64)

      const imgbbRes = await fetch('https://api.imgbb.com/1/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: imgbbParams.toString(),
      })
      const imgbbData = await imgbbRes.json()
      if (imgbbData.success) {
        return NextResponse.json({ url: imgbbData.data.display_url || imgbbData.data.url })
      }
    }

    console.error('Upload failed, response:', JSON.stringify(data))
    return NextResponse.json({ error: 'Upload failed', detail: data.error?.message || data.status_txt || 'Unknown' }, { status: 500 })
  } catch (err: any) {
    console.error('Upload exception:', err)
    return NextResponse.json({ error: 'Upload error', message: err.message }, { status: 500 })
  }
}
