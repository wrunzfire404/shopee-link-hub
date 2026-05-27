import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { isAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST - upload media for Threads posting (Vercel Blob, no crop, keeps original)
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN
  if (!blobToken) {
    return NextResponse.json({ error: 'Blob storage not connected' }, { status: 500 })
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

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 50MB' }, { status: 400 })
    }

    const ext = file.name.split('.').pop() || (file.type.startsWith('video/') ? 'mp4' : 'jpg')
    const filename = `media/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      token: blobToken,
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err: any) {
    console.error('Blob upload error:', err)
    return NextResponse.json({ error: 'Upload failed', message: err.message }, { status: 500 })
  }
}
