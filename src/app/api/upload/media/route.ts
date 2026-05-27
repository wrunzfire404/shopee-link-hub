import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

export const runtime = 'nodejs'
export const maxDuration = 60

// Cloudinary unsigned upload (free tier: 25GB, no daily limit, keeps original)
const CLOUDINARY_CLOUD = process.env.CLOUDINARY_CLOUD_NAME || 'dvfmbceiu'
const CLOUDINARY_PRESET = process.env.CLOUDINARY_UPLOAD_PRESET || 'shopee_media'

// POST - upload media for social posting (NO crop, keeps original aspect ratio)
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'File required' }, { status: 400 })
    }

    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      return NextResponse.json({ error: 'Only image or video' }, { status: 400 })
    }

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 50MB' }, { status: 400 })
    }

    // Upload to Cloudinary (unsigned preset, no modification)
    const uploadData = new FormData()
    uploadData.append('file', file)
    uploadData.append('upload_preset', CLOUDINARY_PRESET)

    const resourceType = isVideo ? 'video' : 'image'
    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/${resourceType}/upload`,
      { method: 'POST', body: uploadData }
    )

    const data = await res.json()

    if (data.secure_url) {
      return NextResponse.json({ url: data.secure_url })
    }

    // If Cloudinary fails (not configured), fallback to Imgur for images
    if (isImage) {
      const bytes = await file.arrayBuffer()
      const base64 = Buffer.from(bytes).toString('base64')

      const imgurRes = await fetch('https://api.imgur.com/3/image', {
        method: 'POST',
        headers: {
          'Authorization': 'Client-ID 546c25a59c58ad7',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64, type: 'base64' }),
      })
      const imgurData = await imgurRes.json()

      if (imgurData.success && imgurData.data?.link) {
        return NextResponse.json({ url: imgurData.data.link })
      }
    }

    return NextResponse.json({
      error: 'Upload failed. Setup Cloudinary: add CLOUDINARY_CLOUD_NAME and CLOUDINARY_UPLOAD_PRESET to env vars.',
      detail: data.error?.message || 'Host rejected'
    }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Upload error', message: err.message }, { status: 500 })
  }
}
