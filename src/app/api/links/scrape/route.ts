import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

// POST - extract product info from Shopee URL
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { url } = await request.json()
  if (!url) {
    return NextResponse.json({ error: 'URL is required' }, { status: 400 })
  }

  try {
    const productData = await extractShopeeProduct(url)
    return NextResponse.json(productData)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to fetch product info', message: e.message },
      { status: 422 }
    )
  }
}

async function extractShopeeProduct(url: string) {
  // Extract shop_id and item_id from Shopee URL
  // Shopee URL formats:
  // https://shopee.co.id/Product-Name-i.shopid.itemid
  // https://shopee.co.id/product/shopid/itemid
  // https://shope.ee/xxxxx (short link - need to resolve)

  let finalUrl = url

  // If it's a short link, resolve it
  if (url.includes('shope.ee') || url.includes('s.shopee')) {
    try {
      const res = await fetch(url, { redirect: 'manual' })
      const location = res.headers.get('location')
      if (location) finalUrl = location
    } catch {
      // If redirect fails, try follow
      try {
        const res = await fetch(url, { redirect: 'follow' })
        finalUrl = res.url
      } catch {}
    }
  }

  // Extract IDs from URL
  const ids = extractShopeeIds(finalUrl)

  if (ids) {
    // Use Shopee's public item API
    const itemData = await fetchShopeeItem(ids.shopId, ids.itemId)
    if (itemData) return itemData
  }

  // Fallback: extract product name from URL slug
  return extractFromUrl(finalUrl)
}

function extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
  // Format: https://shopee.co.id/Product-Name-i.123456.789012
  const iDotMatch = url.match(/i\.(\d+)\.(\d+)/)
  if (iDotMatch) {
    return { shopId: iDotMatch[1], itemId: iDotMatch[2] }
  }

  // Format: https://shopee.co.id/product/123456/789012
  const productMatch = url.match(/\/product\/(\d+)\/(\d+)/)
  if (productMatch) {
    return { shopId: productMatch[1], itemId: productMatch[2] }
  }

  return null
}

async function fetchShopeeItem(shopId: string, itemId: string) {
  try {
    // Shopee public item detail API
    const apiUrl = `https://shopee.co.id/api/v4/item/get?shopid=${shopId}&itemid=${itemId}`

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://shopee.co.id/',
      },
    })

    if (!res.ok) return null

    const json = await res.json()
    const item = json.data

    if (!item) return null

    const price = item.price ? item.price / 100000 : null
    const originalPrice = item.price_before_discount ? item.price_before_discount / 100000 : null
    const discount = item.raw_discount || 0

    // Image URL - Shopee stores images with hash
    const imageUrl = item.image
      ? `https://down-id.img.susercontent.com/file/${item.image}`
      : ''

    return {
      title: item.name || '',
      description: (item.description || '').slice(0, 100),
      imageUrl,
      price: price ? formatRupiah(price) : '',
      originalPrice: originalPrice ? formatRupiah(originalPrice) : '',
      discount: discount ? `-${discount}%` : '',
    }
  } catch {
    return null
  }
}

function extractFromUrl(url: string): any {
  // Extract product name from URL slug
  // https://shopee.co.id/Cohan-DR036-Dress-Mini-Sleeveless-i.46xxx.17xxx
  try {
    const urlObj = new URL(url)
    let pathname = urlObj.pathname

    // Remove leading slash
    pathname = pathname.replace(/^\//, '')

    // Remove the i.shopid.itemid part
    pathname = pathname.replace(/-i\.\d+\.\d+.*$/, '')

    // Replace hyphens with spaces and capitalize
    const title = pathname
      .replace(/-/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim()
      .slice(0, 80)

    return {
      title: title || 'Product',
      description: '',
      imageUrl: '',
      price: '',
      originalPrice: '',
      discount: '',
    }
  } catch {
    return {
      title: '',
      description: '',
      imageUrl: '',
      price: '',
      originalPrice: '',
      discount: '',
    }
  }
}

function formatRupiah(amount: number): string {
  return `Rp ${Math.round(amount).toLocaleString('id-ID')}`
}
