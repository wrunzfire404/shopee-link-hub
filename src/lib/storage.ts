import { promises as fs } from 'fs'
import path from 'path'
import { LinksData, LinkItem } from './types'

const DATA_FILE = path.join(process.cwd(), 'data', 'links.json')

const DEFAULT_DATA: LinksData = {
  config: {
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'Reza Shop',
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Produk Pilihan dengan Harga Terbaik',
  },
  links: []
}

export async function getLinksData(): Promise<LinksData> {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(data)
  } catch {
    // File doesn't exist yet, create it
    await saveLinksData(DEFAULT_DATA)
    return DEFAULT_DATA
  }
}

export async function saveLinksData(data: LinksData): Promise<void> {
  const dir = path.dirname(DATA_FILE)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

export async function getActiveLinks(): Promise<LinkItem[]> {
  const data = await getLinksData()
  return data.links
    .filter(link => link.isActive)
    .sort((a, b) => a.number - b.number)
}

export async function incrementClick(linkId: string): Promise<void> {
  const data = await getLinksData()
  const link = data.links.find(l => l.id === linkId)
  if (link) {
    link.clicks += 1
    await saveLinksData(data)
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}
