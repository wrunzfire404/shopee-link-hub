import { promises as fs } from 'fs'
import path from 'path'
import { put, list, del } from '@vercel/blob'
import { LinksData, LinkItem, AnalyticsSummary } from './types'

const DATA_FILE = path.join(process.cwd(), 'data', 'links.json')
const IS_PRODUCTION = process.env.VERCEL === '1'
const BLOB_TOKEN = process.env.BLOB_READ_WRITE_TOKEN || ''
const BLOB_PATH = 'shopee-links-data.json'

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

// ===== VERCEL BLOB STORAGE =====

async function readFromBlob(): Promise<LinksData | null> {
  try {
    if (!BLOB_TOKEN) {
      console.log('[Storage] No BLOB_TOKEN')
      return null
    }

    // List all blobs with our prefix
    const { blobs } = await list({
      prefix: 'shopee-links-data',
      token: BLOB_TOKEN,
    })

    if (!blobs || blobs.length === 0) {
      console.log('[Storage] No blobs found')
      return null
    }

    // Sort by uploadedAt descending, get most recent
    const sorted = blobs.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    const latestBlob = sorted[0]

    console.log('[Storage] Reading blob:', latestBlob.url)

    const res = await fetch(latestBlob.url, { cache: 'no-store' })
    if (!res.ok) {
      console.log('[Storage] Fetch blob failed:', res.status)
      return null
    }

    const text = await res.text()
    const data = JSON.parse(text) as LinksData
    return data
  } catch (err) {
    console.error('[Storage] readFromBlob error:', err)
    return null
  }
}

async function writeToBlob(data: LinksData): Promise<boolean> {
  try {
    if (!BLOB_TOKEN) {
      console.log('[Storage] No BLOB_TOKEN for write')
      return false
    }

    const jsonStr = JSON.stringify(data)

    // Delete old blobs first to keep it clean
    try {
      const { blobs } = await list({
        prefix: 'shopee-links-data',
        token: BLOB_TOKEN,
      })
      if (blobs && blobs.length > 0) {
        for (const blob of blobs) {
          await del(blob.url, { token: BLOB_TOKEN })
        }
      }
    } catch {
      // Ignore delete errors
    }

    // Write new blob
    const result = await put(BLOB_PATH, jsonStr, {
      access: 'public',
      token: BLOB_TOKEN,
      contentType: 'application/json',
    })

    console.log('[Storage] Written to blob:', result.url)
    return true
  } catch (err) {
    console.error('[Storage] writeToBlob error:', err)
    return false
  }
}

// ===== LOCAL FILE STORAGE (dev) =====

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
  try {
    let data: LinksData | null = null

    if (IS_PRODUCTION && BLOB_TOKEN) {
      data = await readFromBlob()
    } else {
      data = await readFromFile()
    }

    if (!data) {
      await saveLinksData(DEFAULT_DATA)
      return DEFAULT_DATA
    }

    return data
  } catch (err) {
    console.error('[Storage] getLinksData error:', err)
    return DEFAULT_DATA
  }
}

export async function saveLinksData(data: LinksData): Promise<void> {
  // Recalculate analytics
  data.analytics = calculateAnalytics(data)

  if (IS_PRODUCTION && BLOB_TOKEN) {
    const success = await writeToBlob(data)
    if (!success) {
      console.error('[Storage] CRITICAL: Failed to save to blob')
    }
  } else {
    await writeToFile(data)
  }
}

export async function getActiveLinks(): Promise<LinkItem[]> {
  const data = await getLinksData()
  return data.links
    .filter(link => link.isActive)
    .sort((a, b) => {
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
    for (const record of link.clickHistory || []) {
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
