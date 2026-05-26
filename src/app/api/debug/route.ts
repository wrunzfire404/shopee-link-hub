import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { getLinksData } from '@/lib/storage'

// GET - debug storage status (admin only)
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isVercel = process.env.VERCEL === '1'
  const hasBlobToken = !!process.env.BLOB_READ_WRITE_TOKEN
  const blobTokenLength = (process.env.BLOB_READ_WRITE_TOKEN || '').length

  let data = null
  let error = null
  try {
    data = await getLinksData()
  } catch (e: any) {
    error = e.message
  }

  return NextResponse.json({
    env: {
      isVercel,
      hasBlobToken,
      blobTokenLength,
      nodeEnv: process.env.NODE_ENV,
    },
    storage: {
      linksCount: data?.links?.length || 0,
      hasData: !!data,
      error,
    },
    data: data ? { config: data.config, linksCount: data.links.length, links: data.links.map(l => ({ id: l.id, title: l.title, isActive: l.isActive })) } : null,
  })
}
