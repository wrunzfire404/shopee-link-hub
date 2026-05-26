import { NextRequest, NextResponse } from 'next/server'
import { getLinksData, saveLinksData } from '@/lib/storage'
import { isAuthenticated } from '@/lib/auth'

// GET - get categories
export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const data = await getLinksData()
  return NextResponse.json(data.categories)
}

// POST - add category
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await request.json()
  const data = await getLinksData()

  if (!data.categories.includes(name)) {
    data.categories.push(name)
    await saveLinksData(data)
  }

  return NextResponse.json(data.categories)
}

// DELETE - remove category
export async function DELETE(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { name } = await request.json()
  const data = await getLinksData()
  data.categories = data.categories.filter(c => c !== name)
  await saveLinksData(data)

  return NextResponse.json(data.categories)
}
