import { NextRequest, NextResponse } from 'next/server'
import { getLinksData, saveLinksData } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'

// PUT - update site config
export async function PUT(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const data = await getLinksData()

  if (body.name !== undefined) data.config.name = body.name
  if (body.description !== undefined) data.config.description = body.description
  if (body.avatarUrl !== undefined) data.config.avatarUrl = body.avatarUrl
  if (body.socialLinks !== undefined) data.config.socialLinks = body.socialLinks

  await saveLinksData(data)

  return NextResponse.json(data.config)
}
