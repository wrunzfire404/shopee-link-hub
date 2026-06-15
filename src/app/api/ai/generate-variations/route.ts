import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const AI_API_URL = process.env.AI_API_URL || 'https://integrate.api.nvidia.com/v1/chat/completions'
const AI_API_KEY = process.env.AI_API_KEY || process.env.WAVESPEED_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'moonshotai/kimi-k2.6'

// POST - generate caption variations from base caption
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!AI_API_KEY) {
    return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 })
  }

  const { baseCaption, count } = await request.json()

  if (!baseCaption || !count) {
    return NextResponse.json({ error: 'baseCaption and count required' }, { status: 400 })
  }

  const systemPrompt = `Kamu adalah copywriter yang jago bikin variasi caption social media Indonesia.

TUGAS: Dari 1 caption base, bikin ${count} variasi yang BERBEDA tapi inti/meaning SAMA.

RULES:
- Tiap variasi HARUS punya hook/opening yang BEDA
- Susunan kalimat beda, kata-kata beda
- Tone tetep sama (casual/gaul Indonesia)
- JANGAN copy paste — setiap variasi harus unik
- Tetep natural, kayak ditulis orang beda
- Panjang kurang lebih sama dengan base
- Hashtag boleh beda-beda tapi tetep relevant
- Referensi "link di bio" tetep ada tapi variasi kata-katanya
- BATAS KARAKTER: TOTAL MAKSIMAL 400 KARAKTER (TERMASUK HASHTAG). WAJIB PENDEK!

FORMAT OUTPUT:
Tulis setiap variasi dipisah dengan "---" (3 dash). JANGAN kasih numbering atau label. Langsung caption aja.`

  const userPrompt = `Base caption:
"${baseCaption}"

Buatin ${count} variasi dari caption di atas. Ingat: hook BEDA, susunan BEDA, tapi inti SAMA.`

  try {
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 2000,
        temperature: 0.9,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: 'AI request failed', detail: err }, { status: 502 })
    }

    const data = await res.json()
    const rawOutput = data.choices?.[0]?.message?.content || ''

    // Parse variations split by ---
    const variations = rawOutput
      .split('---')
      .map((v: string) => v.trim())
      .filter((v: string) => v.length > 20) // Filter out empty/short splits
      .map((caption: string) => {
        if (caption.length <= 480) return caption;
        
        const allHashtags = caption.match(/#\w+/g) || []
        const tags = allHashtags.slice(0, 3).join(' ')
        const captionWithoutTags = caption.replace(/#\w+/g, '').trim()
        
        const maxBodyLen = 480 - tags.length - 4
        let body = captionWithoutTags.slice(0, maxBodyLen)
        
        const lastEnd = Math.max(body.lastIndexOf('.'), body.lastIndexOf('!'), body.lastIndexOf('?'), body.lastIndexOf('\n'))
        if (lastEnd > maxBodyLen * 0.5) {
          body = body.slice(0, lastEnd + 1)
        }
        
        return body.trim() + '\n\n' + tags
      })

    return NextResponse.json({ variations })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI error', message: err.message }, { status: 500 })
  }
}
