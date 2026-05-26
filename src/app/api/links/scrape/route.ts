import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

// POST - resolve Shopee affiliate link and extract what we can
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
    const result = await resolveShopeeLink(url)
    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to resolve link', message: e.message },
      { status: 422 }
    )
  }
}

async function resolveShopeeLink(url: string) {
  let finalUrl = url

  // Resolve short links (s.shopee.co.id, shope.ee)
  if (url.includes('s.shopee') || url.includes('shope.ee')) {
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        },
      })
      const location = res.headers.get('location')
      if (location) {
        finalUrl = location.split('?')[0] // Remove query params
      }
    } catch {
      // Keep original URL
    }
  }

  // Extract IDs from URL
  const ids = extractShopeeIds(finalUrl)

  // Clean URL (remove tracking params) for display
  const cleanUrl = finalUrl.split('?')[0]

  // Extract product name from URL slug if possible
  const nameFromUrl = extractNameFromUrl(cleanUrl)

  // Build Shopee product page URL (for user reference)
  const productPageUrl = ids
    ? `https://shopee.co.id/product/${ids.shopId}/${ids.itemId}`
    : cleanUrl

  return {
    title: nameFromUrl,
    description: '',
    imageUrl: '',
    price: '',
    originalPrice: '',
    discount: '',
    resolvedUrl: cleanUrl,
    productPageUrl,
    shopId: ids?.shopId || '',
    itemId: ids?.itemId || '',
    note: 'Shopee blocks server-side access. Please enter product name and price manually.',
  }
}

function extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
  // Format: -i.shopid.itemid
  const iDotMatch = url.match(/i\.(\d+)\.(\d+)/)
  if (iDotMatch) {
    return { shopId: iDotMatch[1], itemId: iDotMatch[2] }
  }

  // Format: /product/shopid/itemid
  const productMatch = url.match(/\/product\/(\d+)\/(\d+)/)
  if (productMatch) {
    return { shopId: productMatch[1], itemId: productMatch[2] }
  }

  // Format: /{username}/{shopid}/{itemid}
  const usernameFormat = url.match(/shopee\.co\.id\/[^\/]+\/(\d+)\/(\d+)/)
  if (usernameFormat) {
    return { shopId: usernameFormat[1], itemId: usernameFormat[2] }
  }

  return null
}

function extractNameFromUrl(url: string): string {
  try {
    const urlObj = new URL(url)
    let pathname = decodeURIComponent(urlObj.pathname).replace(/^\//, '')

    // Format: Product-Name-i.shopid.itemid
    const iDotIndex = pathname.indexOf('-i.')
    if (iDotIndex > 0) {
      pathname = pathname.slice(0, iDotIndex)
      return pathname.replace(/-/g, ' ').trim().slice(0, 80)
    }

    // Format: /{username}/{shopid}/{itemid} — can't extract name
    if (/^[^\/]+\/\d+\/\d+/.test(pathname)) {
      return ''
    }

    // Format: /product/{shopid}/{itemid} — can't extract name
    if (pathname.startsWith('product/')) {
      return ''
    }

    return ''
  } catch {
    return ''
  }
}
