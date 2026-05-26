import { promises as fs } from 'fs'
import path from 'path'
import { put, list, del } from '@vercel/blob'
import { LinksData, LinkItem, AnalyticsSummary, ClickRecord } from './types'

const DATA_FILE = path.join(process.cwd(), 'data', 'links.json')
const BLOB_FILENAME = 'shopee-link-hub/links.json'
const IS_VERCEL = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN

const DEFAULT_DATA: LinksData = {
  config: {
    name: process.env.NEXT_PUBLIC_SITE_NAME || 'Reza Shop',
    description: process.env.NEXT_PUBLIC_SITE_DESCRIPTION || 'Produk Pilihan dengan Harga Terbaik 🛍️',
    theme: 'dark',
    accentColor: '#ee4d2d',
    showPoweredBy: false,
    footerText: '🛍️ Semua link mengarah ke Shopee Official',
  },
  links: [],
  categories: ['Fashion', 'Beauty', 'Electronics', 'Home', 'Food', 'Other'],
  analytics: {
    totalClicks: 0,
    totalLinks: 0,
    activeLinks: 0,
    clicksToday: 0,
    clicksThisWeek: 0,
    clicksThisMonth: 0,
    topLinks: [],
    dailyClicks: [],
  },
}

// ===== STORAGE LAYER =====
// Uses local JSON file in dev, Vercel Blob in production

async function readFromBlob(): Promise<LinksData | null> {
  try {
    const { blobs } = await list({ prefix: 'shopee-link-hub/' })
    const blob = blobs.find(b => b.pathname === BLOB_FILENAME)
    if (!blob) return null
    const res = await fetch(blob.url)
    return await res.json()
  } catch {
    return null
  }
}

async function writeToBlob(data: LinksData): Promise<void> {
  await put(BLOB_FILENAME, JSON.stringify(data, null, 2), {
    access: 'public',
    addRandomSuffix: false,
  })
}

async function readFromFile(): Promise<LinksData | null> {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf-8')
    return JSON.parse(raw)
  } catch {
    return null
  }
}

async function writeToFile(data: LinksData): Promise<void> {
  const dir = path.dirname(DATA_FILE)
  await fs.mkdir(dir, { recursive: true })
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// ===== PUBLIC API =====

export async function getLinksData(): Promise<LinksData> {
  let data: LinksData | null = null

  if (IS_VERCEL) {
    data = await readFromBlob()
  } else {
    data = await readFromFile()
  }

  if (!data) {
    await saveLinksData(DEFAULT_DATA)
    return DEFAULT_DATA
  }

  return data
}

export async function saveLinksData(data: LinksData): Promise<void> {
  // Recalculate analytics
  data.analytics = calculateAnalytics(data)

  if (IS_VERCEL) {
    await writeToBlob(data)
  } else {
    await writeToFile(data)
  }
}

export async function getActiveLinks(): Promise<LinkItem[]> {
  const data = await getLinksData()
  return data.links
    .filter(link => link.isActive)
    .sort((a, b) => {
      // Pinned items first, then by number
      if (a.isPinned && !b.isPinned) return -1
      if (!a.isPinned && b.isPinned) return 1
      return a.number - b.number
    })
}

export async function incrementClick(linkId: string, platform?: string): Promise<void> {
  const data = await getLinksData()
  const link = data.links.find(l => l.id === linkId)
  if (link) {
    link.clicks += 1
    const today = new Date().toISOString().split('T')[0]
    const todayRecord = link.clickHistory.find(r => r.date === today)
    if (todayRecord) {
      todayRecord.count += 1
    } else {
      link.clickHistory.push({ date: today, count: 1, platform })
    }
    await saveLinksData(data)
  }
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

// ===== ANALYTICS =====

function calculateAnalytics(data: LinksData): AnalyticsSummary {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  let clicksToday = 0
  let clicksThisWeek = 0
  let clicksThisMonth = 0
  const dailyClicksMap: Record<string, number> = {}

  for (const link of data.links) {
    for (const record of link.clickHistory) {
      if (record.date === today) clicksToday += record.count
      if (record.date >= weekAgo) clicksThisWeek += record.count
      if (record.date >= monthAgo) clicksThisMonth += record.count

      if (record.date >= monthAgo) {
        dailyClicksMap[record.date] = (dailyClicksMap[record.date] || 0) + record.count
      }
    }
  }

  const topLinks = [...data.links]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 5)
    .map(l => ({ id: l.id, title: l.title, clicks: l.clicks }))

  const dailyClicks = Object.entries(dailyClicksMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }))

  return {
    totalClicks: data.links.reduce((sum, l) => sum + l.clicks, 0),
    totalLinks: data.links.length,
    activeLinks: data.links.filter(l => l.isActive).length,
    clicksToday,
    clicksThisWeek,
    clicksThisMonth,
    topLinks,
    dailyClicks,
  }
}
