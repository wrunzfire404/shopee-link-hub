import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { UTApi } from 'uploadthing/server'

export const runtime = 'nodejs'
export const maxDuration = 60

const utapi = new UTApi()

// POST - upload media for Threads posting (Uploadthing, no crop, keeps original)
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

    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'Max 50MB' }, { status: 400 })
    }

    const response = await utapi.uploadFiles(file)

    if (response.data?.ufsUrl) {
      return NextResponse.json({ url: response.data.ufsUrl })
    }

    if (response.data?.url) {
      return NextResponse.json({ url: response.data.url })
    }

    return NextResponse.json({ error: 'Upload failed', detail: response.error?.message || 'Unknown' }, { status: 500 })
  } catch (err: any) {
    console.error('Upload error:', err)
    return NextResponse.json({ error: 'Upload failed', message: err.message }, { status: 500 })
  }
}
