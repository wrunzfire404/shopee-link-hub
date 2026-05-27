import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { UTApi } from 'uploadthing/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const utapi = new UTApi()

// POST - upload media for Threads posting
// Images → Imgur (public, proper extension)
// Videos → Uploadthing (supports video)
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

    // IMAGES → Imgur
    if (file.type.startsWith('image/')) {
      if (file.size > 10 * 1024 * 1024) {
        return NextResponse.json({ error: 'Image max 10MB' }, { status: 400 })
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
        return NextResponse.json({ url: data.data.link })
      }
      return NextResponse.json({ error: 'Image upload failed', detail: data.data?.error }, { status: 500 })
    }

    // VIDEOS → Uploadthing
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Video max 50MB' }, { status: 400 })
    }

    // Rename file to include proper extension
    const ext = file.name.split('.').pop() || 'mp4'
    const properName = `video-${Date.now()}.${ext}`
    const renamedFile = new File([file], properName, { type: file.type })

    const response = await utapi.uploadFiles(renamedFile)

    if (response.data?.ufsUrl) {
      // Uploadthing URL - append extension for Wahdx
      const url = response.data.ufsUrl
      const finalUrl = url.endsWith(`.${ext}`) ? url : `${url}/${properName}`
      return NextResponse.json({ url: finalUrl })
    }

    return NextResponse.json({ error: 'Video upload failed', detail: response.error?.message }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Upload error', message: err.message }, { status: 500 })
  }
}
