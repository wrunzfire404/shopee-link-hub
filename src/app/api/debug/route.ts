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
  const redisUrl = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL || ''
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN || ''

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
      hasRedisUrl: !!redisUrl,
      hasRedisToken: !!redisToken,
      redisUrlPrefix: redisUrl.slice(0, 30) + '...',
    },
    storage: {
      linksCount: data?.links?.length || 0,
      hasData: !!data,
      error,
    },
    links: data?.links?.map(l => ({ id: l.id, title: l.title, isActive: l.isActive })) || [],
  })
}
