import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import { list } from '@vercel/blob'

// GET - debug storage status (admin only)
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isVercel = process.env.VERCEL === '1'
  const blobToken = process.env.BLOB_READ_WRITE_TOKEN || ''
  const hasBlobToken = !!blobToken

  let blobInfo: any = null
  let blobError: string | null = null
  let blobData: any = null

  if (hasBlobToken) {
    try {
      const { blobs } = await list({
        prefix: 'shopee-links-data',
        token: blobToken,
      })
      blobInfo = {
        count: blobs.length,
        blobs: blobs.map(b => ({
          pathname: b.pathname,
          url: b.url,
          size: b.size,
          uploadedAt: b.uploadedAt,
        })),
      }

      // Try to read the latest blob
      if (blobs.length > 0) {
        const sorted = blobs.sort((a, b) =>
          new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )
        const res = await fetch(sorted[0].url, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          blobData = {
            linksCount: data.links?.length || 0,
            links: (data.links || []).map((l: any) => ({ id: l.id, title: l.title, isActive: l.isActive })),
            config: data.config,
          }
        }
      }
    } catch (e: any) {
      blobError = e.message
    }
  }

  return NextResponse.json({
    env: { isVercel, hasBlobToken, blobTokenLength: blobToken.length },
    blob: blobInfo,
    blobError,
    data: blobData,
  })
}
