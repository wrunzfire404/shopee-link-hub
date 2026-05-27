import { NextRequest, NextResponse } from 'next/server'
import { getLinksData, saveLinksData } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'

// GET - list slugs
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await getLinksData()
  return NextResponse.json(data.slugs || [])
}

// POST - add slug
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name } = await request.json()
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 })

  const slug = name.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30)
  const data = await getLinksData()
  if (!data.slugs) data.slugs = []
  if (!data.slugs.includes(slug)) {
    data.slugs.push(slug)
    await saveLinksData(data)
  }
  return NextResponse.json(data.slugs)
}

// DELETE - remove slug
export async function DELETE(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const { name } = await request.json()
  const data = await getLinksData()
  if (!data.slugs) data.slugs = []
  data.slugs = data.slugs.filter(s => s !== name)
  await saveLinksData(data)
  return NextResponse.json(data.slugs)
}
