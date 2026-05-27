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

  const { productName, price, discount, description, platform, style, linkNumber } = await request.json()

  const systemPrompt = `Kamu adalah copywriter social media Indonesia yang jago bikin caption viral. 
Kamu nulis kayak anak muda Jakarta — santai, natural, pake bahasa sehari-hari.

RULES PENTING:
- HARUS ada hook di kalimat pertama (bikin orang stop scroll)
- Bahasa Indonesia gaul/casual (bukan formal)
- Pake singkatan natural: "gue", "lo", "bgt", "banget", "gak", "udah", "emg"
- Sesekali typo dikit gapapa (biar human)
- JANGAN pakai kata-kata AI: "merupakan", "menawarkan", "sangat", "luar biasa"
- JANGAN kayak robot/template
- Short sentences, punchy
- Max 3-4 baris aja
- Emoji sparingly (max 2-3)
- JANGAN masukin link apapun di caption
- Di akhir, arahkan ke bio: "cek link di bio nomer ${linkNumber || 'X'}" atau variasi natural lainnya
- Include 3-5 hashtag relevant di akhir

STYLE OPTIONS:
- "review": kayak lagi review produk ke temen
- "promo": excited soal deal/diskon
- "story": cerita singkat kenapa beli/suka

OUTPUT: Langsung caption aja, gak perlu penjelasan.`

  const userPrompt = `Buatin caption ${platform || 'Threads'} untuk produk ini:
- Nama: ${productName}
- Harga: ${price || 'tidak disebutkan'}
- Diskon: ${discount || 'tidak ada'}
- Deskripsi: ${description || 'tidak ada'}
- Style: ${style || 'review'}
- Nomer di bio: ${linkNumber || '1'}

Ingat: hook kuat di awal, bahasa natural, TANPA link URL, arahkan ke "link di bio nomer ${linkNumber || '1'}".`

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
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 300,
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
