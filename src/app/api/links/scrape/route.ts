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
      { error: 'Failed to fetch', message: e.message },
      { status: 422 }
    )
  }
}

async function extractShopeeProduct(url: string) {
  let finalUrl = url

  // Resolve short links (s.shopee.co.id, shope.ee)
  if (url.includes('s.shopee') || url.includes('shope.ee')) {
    finalUrl = await resolveShortLink(url)
  }

  // Try to extract shop_id and item_id
  const ids = extractShopeeIds(finalUrl)

  if (ids) {
    // Try Shopee API
    const apiData = await fetchFromShopeeApi(ids.shopId, ids.itemId)
    if (apiData && apiData.title) return apiData
  }

  // Fallback: extract from URL slug (full shopee.co.id URL)
  return extractFromUrlSlug(finalUrl)
}

async function resolveShortLink(url: string): Promise<string> {
  try {
    // First try: manual redirect follow
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
    })

    // Check Location header
    const location = res.headers.get('location')
    if (location && location.includes('shopee')) {
      // Sometimes it redirects multiple times
      if (location.includes('s.shopee') || location.includes('shope.ee')) {
        return await resolveShortLink(location)
      }
      return location
    }

    // Try follow redirect
    const res2 = await fetch(url, {
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      },
    })
    return res2.url
  } catch {
    return url
  }
}

function extractShopeeIds(url: string): { shopId: string; itemId: string } | null {
  // Format: /product/shopid/itemid
  const productMatch = url.match(/\/product\/(\d+)\/(\d+)/)
  if (productMatch) {
    return { shopId: productMatch[1], itemId: productMatch[2] }
  }

  // Format: -i.shopid.itemid
  const iDotMatch = url.match(/i\.(\d+)\.(\d+)/)
  if (iDotMatch) {
    return { shopId: iDotMatch[1], itemId: iDotMatch[2] }
  }

  // Format: shop/shopid/product/itemid  
  const shopProductMatch = url.match(/shop\/(\d+)\/product\/(\d+)/)
  if (shopProductMatch) {
    return { shopId: shopProductMatch[1], itemId: shopProductMatch[2] }
  }

  return null
}

async function fetchFromShopeeApi(shopId: string, itemId: string) {
  try {
    const apiUrl = `https://shopee.co.id/api/v4/item/get?shopid=${shopId}&itemid=${itemId}`

    const res = await fetch(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Referer': 'https://shopee.co.id/',
        'af-ac-enc-dat': 'null',
      },
    })

    if (!res.ok) return null

    const json = await res.json()
    const item = json?.data

    if (!item || !item.name) return null

    // Shopee prices are in units of 100000 (e.g., 5000000 = Rp 50.000)
    const price = item.price ? item.price / 100000 : null
    const priceBeforeDiscount = item.price_before_discount
      ? item.price_before_discount / 100000
      : null
    const discount = item.raw_discount || 0

    const imageUrl = item.image
      ? `https://down-id.img.susercontent.com/file/${item.image}`
      : ''

    return {
      title: item.name.slice(0, 80),
      description: (item.description || '').slice(0, 100),
      imageUrl,
      price: price ? `Rp ${Math.round(price).toLocaleString('id-ID')}` : '',
      originalPrice: priceBeforeDiscount ? `Rp ${Math.round(priceBeforeDiscount).toLocaleString('id-ID')}` : '',
      discount: discount > 0 ? `-${discount}%` : '',
    }
  } catch {
    return null
  }
}

function extractFromUrlSlug(url: string) {
  try {
    const urlObj = new URL(url)
    let pathname = decodeURIComponent(urlObj.pathname)

    // Remove leading slash
    pathname = pathname.replace(/^\//, '')

    // Remove i.shopid.itemid or product/shopid/itemid parts
    pathname = pathname.replace(/-i\.\d+\.\d+.*$/, '')
    pathname = pathname.replace(/\/product\/\d+\/\d+.*$/, '')
    pathname = pathname.replace(/^product\/\d+\/\d+/, '')

    // If path looks like "Username/shopid/itemid", it's not useful
    if (/^\w+\/\d+\/\d+/.test(pathname)) {
      return {
        title: '',
        description: '',
        imageUrl: '',
        price: '',
        originalPrice: '',
        discount: '',
      }
    }

    // Replace hyphens and underscores with spaces
    const title = pathname
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80)

    return {
      title: title || '',
      description: '',
      imageUrl: '',
      price: '',
      originalPrice: '',
      discount: '',
    }
  } catch {
    return { title: '', description: '', imageUrl: '', price: '', originalPrice: '', discount: '' }
  }
}
