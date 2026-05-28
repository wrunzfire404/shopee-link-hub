import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const AI_API_URL = 'https://llm.wavespeed.ai/v1/chat/completions'
const AI_API_KEY = process.env.WAVESPEED_API_KEY || ''

// POST - generate caption from product info
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!AI_API_KEY) {
    return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 })
  }

  const { productName, price, discount, description, platform, style, linkNumber, imageUrl } = await request.json()

  const isIG = platform?.toLowerCase().includes('instagram')

  const systemPrompt = `Kamu copywriter social media Indonesia. Nulis kayak anak muda biasa — bukan AI, bukan robot, bukan template.

KARAKTER LO:
- Lo nulis kayak chat ke temen
- Bahasa campur: Indo gaul + sesekali English slang
- Pake "gue/gw", "lo", "bgt", "gak", "emg", "sumpah", "anjir"
- Kadang typo dikit (biar human banget)
- JANGAN PERNAH pakai: "merupakan", "menawarkan", "sangat cocok", "luar biasa", "sempurna"
- JANGAN pakai kalimat panjang formal

FORMAT:
${isIG ? `- Instagram: boleh lebih panjang (4-6 baris)
- Hashtag: 8-15 hashtag di akhir (mix populer + niche)
- Tone sedikit lebih polished tapi tetep casual` : `- Threads: pendek aja (2-4 baris)
- Hashtag: 3-5 aja di akhir
- Tone: super casual, kayak ngetweet`}

WAJIB:
- Hook killer di kalimat pertama (bikin stop scroll)
- TANPA link URL di caption
- Arahkan ke bio: variasi dari "link di bio nomer ${linkNumber || 'X'}"
- Jangan selalu pakai format yang sama — kreatif

STYLE: "${style || 'review'}"
- review: kayak cerita ke temen soal barang yg lo beli
- promo: excited + FOMO vibes
- story: mini storytelling kenapa beli

OUTPUT: Langsung caption aja.`

  const userPrompt = `Caption ${platform || 'Threads'} buat: ${productName}${price ? ` (${price})` : ''}${discount ? ` ${discount}` : ''}${description ? ` - ${description}` : ''}
Bio nomer: ${linkNumber || '1'}
Style: ${style || 'review'}`

  try {
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.7',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: imageUrl
              ? [
                  { type: 'image_url', image_url: { url: imageUrl } },
                  { type: 'text', text: userPrompt + '\n\nAnalisa gambar produk ini juga buat bikin caption yang lebih detail dan akurat.' },
                ]
              : userPrompt,
          },
        ],
        max_tokens: 400,
        temperature: 0.85,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: 'AI request failed', detail: err }, { status: 502 })
    }

    const data = await res.json()
    const caption = data.choices?.[0]?.message?.content || ''

    return NextResponse.json({ caption })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI error', message: err.message }, { status: 500 })
  }
}
