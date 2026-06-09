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

    // VIDEOS → Catbox.moe (Free, up to 200MB, no API key needed)
    if (file.size > 200 * 1024 * 1024) {
      return NextResponse.json({ error: 'Video max 200MB' }, { status: 400 })
    }

    const catboxForm = new FormData()
    catboxForm.append('reqtype', 'fileupload')
    catboxForm.append('fileToUpload', file)

    const response = await fetch('https://catbox.moe/user/api.php', {
      method: 'POST',
      body: catboxForm,
    })

    if (response.ok) {
      const url = await response.text()
      if (url.startsWith('http')) {
        return NextResponse.json({ url })
      }
    }

    return NextResponse.json({ error: 'Video upload failed', detail: await response.text() }, { status: 500 })
  } catch (err: any) {
    return NextResponse.json({ error: 'Upload error', message: err.message }, { status: 500 })
  }
}
