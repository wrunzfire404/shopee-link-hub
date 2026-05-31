import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'
import sharp from 'sharp'

export const runtime = 'nodejs'
export const maxDuration = 60

// POST - take image URLs and generate unique variants
// Body: { imageUrls: string[], count: number }
// Returns: { variants: string[][] } - array of URL arrays, one per account
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { imageUrls, count } = await request.json()

    if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
      return NextResponse.json({ error: 'imageUrls array required' }, { status: 400 })
    }
    if (!count || count < 1) {
      return NextResponse.json({ error: 'count required (number of variants)' }, { status: 400 })
    }

    // First variant = original images (for first account)
    const variants: string[][] = [imageUrls]

    // Generate unique variants for remaining accounts
    for (let i = 1; i < count; i++) {
      const variantUrls: string[] = []

      for (const url of imageUrls) {
        const uniqueUrl = await createUniqueVariant(url, i)
        variantUrls.push(uniqueUrl)
      }

      variants.push(variantUrls)
    }

    return NextResponse.json({ variants })
  } catch (err: any) {
    console.error('Uniquify error:', err)
    return NextResponse.json({ error: 'Uniquify failed', message: err.message }, { status: 500 })
  }
}

async function createUniqueVariant(imageUrl: string, seed: number): Promise<string> {
  // Fetch original image
  const res = await fetch(imageUrl)
  if (!res.ok) throw new Error(`Failed to fetch image: ${imageUrl}`)

  const buffer = Buffer.from(await res.arrayBuffer())

  // Apply minimal modifications (invisible but changes hash)
  const brightness = 1 + (((seed * 13) % 4) - 2) / 100 // 0.98 to 1.02 (barely noticeable)
  const quality = 95 - (seed % 4) // 92-95 quality (high, minimal loss)

  const processed = await sharp(buffer)
    .modulate({ brightness })
    .jpeg({ quality, mozjpeg: true })
    .toBuffer()

  // Upload the unique variant to Imgur
  const base64 = processed.toString('base64')

  const imgurRes = await fetch('https://api.imgur.com/3/image', {
    method: 'POST',
    headers: {
      'Authorization': 'Client-ID 546c25a59c58ad7',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ image: base64, type: 'base64' }),
  })

  const imgurData = await imgurRes.json()

  if (imgurData.success && imgurData.data?.link) {
    return imgurData.data.link
  }

  // Fallback: return original if upload fails
  return imageUrl
}
