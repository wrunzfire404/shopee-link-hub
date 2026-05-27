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

  const prompt = `Kamu senior marketing agent dengan pengalaman 10 tahun di e-commerce Indonesia. Kamu tau persis nama produk seperti apa yang bikin orang klik dan beli.

Dari nama produk ini: "${originalName}"

Bikin 3 alternatif nama yang lebih menjual. Bebas berkreasi, yang penting:
- Tetep sesuai produknya
- Pendek (max 5 kata)
- Bikin orang penasaran/pengen beli

3 nama, pisah newline. Langsung aja.`

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
