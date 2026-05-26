import { NextRequest, NextResponse } from 'next/server'
import { getLinksData, saveLinksData } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'

// PUT - update a link
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const data = await getLinksData()
  const linkIndex = data.links.findIndex(l => l.id === params.id)

  if (linkIndex === -1) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  // Update fields
  const link = data.links[linkIndex]
  if (body.title !== undefined) link.title = body.title
  if (body.description !== undefined) link.description = body.description
  if (body.url !== undefined) link.url = body.url
  if (body.imageUrl !== undefined) link.imageUrl = body.imageUrl
  if (body.price !== undefined) link.price = body.price
  if (body.discount !== undefined) link.discount = body.discount
  if (body.isActive !== undefined) link.isActive = body.isActive
  if (body.number !== undefined) link.number = body.number
  link.updatedAt = new Date().toISOString()

  data.links[linkIndex] = link
  await saveLinksData(data)

  return NextResponse.json(link)
}

// DELETE - delete a link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getLinksData()
  const linkIndex = data.links.findIndex(l => l.id === params.id)

  if (linkIndex === -1) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  data.links.splice(linkIndex, 1)
  await saveLinksData(data)

  return NextResponse.json({ success: true })
}
