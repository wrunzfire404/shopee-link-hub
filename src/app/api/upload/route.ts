import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { isAuthenticated } from '@/lib/auth'

// POST - upload image file
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

  // Validate file type
  if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
    return NextResponse.json({ error: 'File must be an image or video' }, { status: 400 })
  }

  // Validate file size (max 50MB for video, 2MB for image)
  const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 2 * 1024 * 1024
  if (file.size > maxSize) {
    return NextResponse.json({ error: `File too large (max ${file.type.startsWith('video/') ? '50MB' : '2MB'})` }, { status: 400 })
  }

  const blobToken = process.env.BLOB_READ_WRITE_TOKEN

  if (!blobToken) {
    return NextResponse.json({ error: 'Blob storage not configured' }, { status: 500 })
  }

  try {
    // Generate unique filename
    const ext = file.name.split('.').pop() || 'jpg'
    const filename = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      token: blobToken,
      contentType: file.type,
    })

    return NextResponse.json({ url: blob.url })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed', message: err.message }, { status: 500 })
  }
}
