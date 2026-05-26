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
    originalPrice: body.originalPrice || '',
    discount: body.discount || '',
    category: body.category || '',
    isActive: body.isActive ?? true,
    isPinned: body.isPinned ?? false,
    clicks: 0,
    clickHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  data.links.push(newLink)
  await saveLinksData(data)

  return NextResponse.json(newLink, { status: 201 })
}

// PUT - bulk actions or reorder
export async function PUT(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const data = await getLinksData()

  if (body.action === 'reorder' && Array.isArray(body.order)) {
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

  if (body.action === 'bulk') {
    const { bulkAction, ids, value } = body
    for (const id of ids) {
      const link = data.links.find(l => l.id === id)
      if (!link) continue

      switch (bulkAction) {
        case 'activate':
          link.isActive = true
          break
        case 'deactivate':
          link.isActive = false
          break
        case 'delete':
          const idx = data.links.findIndex(l => l.id === id)
          if (idx !== -1) data.links.splice(idx, 1)
          break
        case 'setCategory':
          link.category = value || ''
          break
        case 'pin':
          link.isPinned = true
          break
        case 'unpin':
          link.isPinned = false
          break
      }
    }
    await saveLinksData(data)
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
