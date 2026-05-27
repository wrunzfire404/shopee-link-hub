import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const AI_API_URL = 'https://llm.wavespeed.ai/v1/chat/completions'
const AI_API_KEY = process.env.WAVESPEED_API_KEY || ''

// POST - optimize product name for better marketing appeal
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!AI_API_KEY) {
    return NextResponse.json({ error: 'AI not configured' }, { status: 500 })
  }

  const { originalName } = await request.json()
  if (!originalName) {
    return NextResponse.json({ error: 'originalName required' }, { status: 400 })
  }

  const prompt = `Kamu copywriter e-commerce Indonesia yang jago bikin nama produk pendek & catchy.

TUGAS: Dari nama produk Shopee yang panjang, bikin 3 nama pendek yang bikin orang pengen klik.

RULES:
- Max 4-5 kata
- Boleh campur bahasa Indonesia + Inggris
- JANGAN selalu pakai kata "viral", "premium", "must have", "wajib punya", "best seller" — itu udah overused
- Kreatiflah! Pakai angle berbeda tiap opsi:
  - Opsi 1: Fokus benefit/keunggulan (misal: "Tanktop Anti Gerah")
  - Opsi 2: Fokus vibe/aesthetic (misal: "Daily Outfit Adem")  
  - Opsi 3: Fokus urgency/desire (misal: "Tanktop 50rb Sold 1000+")
- Hapus brand noname, ukuran, keyword spam
- Bikin kedengeran kayak judul TikTok/Reels yang orang klik

FORMAT: 3 nama dipisah newline. Langsung nama aja.

Nama asli: "${originalName}"`

  try {
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'anthropic/claude-opus-4.7',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0.8,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'AI failed' }, { status: 502 })
    }

    const data = await res.json()
    const output = data.choices?.[0]?.message?.content || ''
    const suggestions = output.split('\n').map((s: string) => s.trim()).filter((s: string) => s.length > 3)

    return NextResponse.json({ suggestions })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI error', message: err.message }, { status: 500 })
  }
}
