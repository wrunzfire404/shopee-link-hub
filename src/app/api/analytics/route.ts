import { NextResponse } from 'next/server'
import { getLinksData } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'

// GET - get analytics data
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getLinksData()
  return NextResponse.json(data.analytics)
}
