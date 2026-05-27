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

  // Apply random-ish modifications based on seed
  const rotation = ((seed * 7) % 5) - 2 // -2 to +2 degrees
  const brightness = 1 + (((seed * 13) % 10) - 5) / 100 // 0.95 to 1.05
  const cropPx = (seed % 4) + 1 // 1-4 pixels

  const metadata = await sharp(buffer).metadata()
  const width = metadata.width || 1080
  const height = metadata.height || 1080

  const processed = await sharp(buffer)
    .rotate(rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .modulate({ brightness })
    .extract({
      left: cropPx,
      top: cropPx,
      width: Math.max(width - cropPx * 2, 100),
      height: Math.max(height - cropPx * 2, 100),
    })
    .resize(width, height) // resize back to original dimensions
    .jpeg({ quality: 92 + (seed % 6) }) // slightly different quality each time
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
