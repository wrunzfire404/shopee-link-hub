import { NextRequest, NextResponse } from 'next/server'
import { getLinksData, saveLinksData, generateId } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'

// POST - duplicate a link
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const data = await getLinksData()
  const original = data.links.find(l => l.id === params.id)

  if (!original) {
    return NextResponse.json({ error: 'Link not found' }, { status: 404 })
  }

  const maxNumber = Math.max(...data.links.map(l => l.number))

  const duplicate = {
    ...original,
    id: generateId(),
    number: maxNumber + 1,
    title: `${original.title} (copy)`,
    clicks: 0,
    clickHistory: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  data.links.push(duplicate)
  await saveLinksData(data)

  return NextResponse.json(duplicate, { status: 201 })
}
