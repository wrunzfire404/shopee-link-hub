import { NextRequest, NextResponse } from 'next/server'
import { getLinksData, saveLinksData, generateId } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'
import { LinkItem } from '@/lib/types'

// GET - get all links (admin)
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getLinksData()
  return NextResponse.json(data)
}

// POST - create new link
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const data = await getLinksData()

  // Auto-assign number (next available)
  const maxNumber = data.links.length > 0
    ? Math.max(...data.links.map(l => l.number))
    : 0

  const newLink: LinkItem = {
    id: generateId(),
    number: body.number || maxNumber + 1,
    title: body.title,
    description: body.description || '',
    url: body.url,
    imageUrl: body.imageUrl || '',
    price: body.price || '',
    discount: body.discount || '',
    isActive: body.isActive ?? true,
    clicks: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  data.links.push(newLink)
  await saveLinksData(data)

  return NextResponse.json(newLink, { status: 201 })
}

// PUT - update link order (reorder)
export async function PUT(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()

  if (body.action === 'reorder' && Array.isArray(body.order)) {
    const data = await getLinksData()
    // body.order is array of { id, number }
    for (const item of body.order) {
      const link = data.links.find(l => l.id === item.id)
      if (link) {
        link.number = item.number
        link.updatedAt = new Date().toISOString()
      }
    }
    await saveLinksData(data)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
