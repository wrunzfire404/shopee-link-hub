import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

// POST - scrape product info from Shopee URL
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
    // Try to extract product info from Shopee URL
    // Shopee affiliate links redirect to actual product pages
    // We fetch the page and extract Open Graph meta tags
    const productData = await scrapeShopeeProduct(url)
    return NextResponse.json(productData)
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Failed to fetch product info', message: e.message },
      { status: 422 }
    )
  }
}

async function scrapeShopeeProduct(url: string) {
  // Follow redirects to get final URL
  const response = await fetch(url, {
    redirect: 'follow',
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    },
  })

  const html = await response.text()

  // Extract Open Graph tags
  const title = extractMeta(html, 'og:title') || extractMeta(html, 'title') || ''
  const description = extractMeta(html, 'og:description') || ''
  const imageUrl = extractMeta(html, 'og:image') || ''

  // Try to extract price from meta or structured data
  const price = extractPrice(html)
  const originalPrice = extractOriginalPrice(html)
  const discount = calculateDiscount(price, originalPrice)

  return {
    title: cleanTitle(title),
    description: description.slice(0, 100),
    imageUrl,
    price: price ? formatRupiah(price) : '',
    originalPrice: originalPrice ? formatRupiah(originalPrice) : '',
    discount: discount || '',
  }
}

function extractMeta(html: string, property: string): string {
  // Try og: property
  const ogMatch = html.match(
    new RegExp(`<meta[^>]*property=["']og:${property.replace('og:', '')}["'][^>]*content=["']([^"']*)["']`, 'i')
  )
  if (ogMatch) return ogMatch[1]

  // Try name property
  const nameMatch = html.match(
    new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i')
  )
  if (nameMatch) return nameMatch[1]

  // Try reversed attribute order
  const reversedMatch = html.match(
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']og:${property.replace('og:', '')}["']`, 'i')
  )
  if (reversedMatch) return reversedMatch[1]

  return ''
}

function extractPrice(html: string): number | null {
  // Look for price in structured data (JSON-LD)
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
      try {
        const data = JSON.parse(jsonContent)
        if (data.offers?.price) return Number(data.offers.price)
        if (data.offers?.lowPrice) return Number(data.offers.lowPrice)
      } catch {}
    }
  }

  // Look for price pattern in og:description or page content
  const priceMatch = html.match(/Rp\s?([\d.,]+)/i)
  if (priceMatch) {
    const cleaned = priceMatch[1].replace(/\./g, '').replace(',', '')
    return Number(cleaned)
  }

  return null
}

function extractOriginalPrice(html: string): number | null {
  // Try to find original/strikethrough price in JSON-LD
  const jsonLdMatch = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  if (jsonLdMatch) {
    for (const match of jsonLdMatch) {
      const jsonContent = match.replace(/<script[^>]*>/, '').replace(/<\/script>/, '')
      try {
        const data = JSON.parse(jsonContent)
        if (data.offers?.highPrice) return Number(data.offers.highPrice)
      } catch {}
    }
  }
  return null
}

function calculateDiscount(price: number | null, originalPrice: number | null): string {
  if (!price || !originalPrice || originalPrice <= price) return ''
  const discount = Math.round(((originalPrice - price) / originalPrice) * 100)
  return `-${discount}%`
}

function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString('id-ID')}`
}

function cleanTitle(title: string): string {
  // Remove common Shopee suffixes
  return title
    .replace(/\s*\|\s*Shopee\s*Indonesia/gi, '')
    .replace(/\s*-\s*Shopee/gi, '')
    .trim()
    .slice(0, 80)
}
