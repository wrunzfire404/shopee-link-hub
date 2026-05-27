import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const IMGBB_API_KEY = process.env.IMGBB_API_KEY || '367e08a72ed929e71be498f74c02cbe7'

// POST - upload image/video file
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  // For videos, we need a different approach - use Vercel Blob if available
  if (file.type.startsWith('video/')) {
    return await handleVideoUpload(file)
  }

  // For images, use imgbb (free, reliable)
  return await handleImageUpload(file)
}

async function handleImageUpload(file: File) {
  try {
    // Convert file to base64
    const bytes = await file.arrayBuffer()
    const base64 = Buffer.from(bytes).toString('base64')

    // Upload to imgbb
    const formData = new FormData()
    formData.append('key', IMGBB_API_KEY)
    formData.append('image', base64)
    formData.append('name', file.name.replace(/\.[^.]+$/, ''))

    const res = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    })

    if (!res.ok) {
      const err = await res.text()
      console.error('imgbb error:', err)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const data = await res.json()

    if (!data.success) {
      return NextResponse.json({ error: 'Upload failed', detail: data }, { status: 500 })
    }

    return NextResponse.json({ url: data.data.url })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed', message: err.message }, { status: 500 })
  }
}

async function handleVideoUpload(file: File) {
  // Try Vercel Blob for video (if available)
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN

  if (blobToken) {
    try {
      const { put } = await import('@vercel/blob')
      const ext = file.name.split('.').pop() || 'mp4'
      const filename = `videos/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

      const blob = await put(filename, file, {
        access: 'public',
        token: blobToken,
        contentType: file.type,
      })

      return NextResponse.json({ url: blob.url })
    } catch (err: any) {
      console.error('Blob video upload error:', err)
    }
  }

  // Fallback: return error with guidance
  return NextResponse.json(
    { error: 'Video upload requires Blob storage. Connect Vercel Blob or use a video URL instead.' },
    { status: 422 }
  )
}
