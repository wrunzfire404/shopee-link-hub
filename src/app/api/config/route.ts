import { NextRequest, NextResponse } from 'next/server'
import { getLinksData, saveLinksData } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'

// GET - get site config
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await getLinksData()
  return NextResponse.json(data.config)
}

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
  if (body.theme !== undefined) data.config.theme = body.theme
  if (body.accentColor !== undefined) data.config.accentColor = body.accentColor
  if (body.socialLinks !== undefined) data.config.socialLinks = body.socialLinks
  if (body.footerText !== undefined) data.config.footerText = body.footerText
  if (body.showPoweredBy !== undefined) data.config.showPoweredBy = body.showPoweredBy

  await saveLinksData(data)
  return NextResponse.json(data.config)
}
