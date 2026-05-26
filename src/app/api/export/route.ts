import { NextResponse } from 'next/server'
import { getLinksData } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'

// GET - export all data as JSON (backup)
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getLinksData()

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="shopee-links-backup-${new Date().toISOString().split('T')[0]}.json"`,
    },
  })
}
