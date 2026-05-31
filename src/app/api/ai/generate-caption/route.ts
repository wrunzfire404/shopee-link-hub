import { NextRequest, NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const AI_API_URL = process.env.AI_API_URL || 'https://unix-none-limitations-sterling.trycloudflare.com/v1/chat/completions'
const AI_API_KEY = process.env.AI_API_KEY || process.env.WAVESPEED_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || 'kiro/claude-sonnet-4.5-thinking'

// POST - generate caption from product info
export async function POST(request: NextRequest) {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!AI_API_KEY) {
    return NextResponse.json({ error: 'AI API key not configured' }, { status: 500 })
  }

  const { productName, price, discount, description, platform, style, linkNumber, imageUrl, type, orderContact } = await request.json()

  const isIG = platform?.toLowerCase().includes('instagram')
  const isDigital = type === 'digital' || !!orderContact

  const systemPrompt = isDigital ? `Kamu copywriter yang jago jualan produk digital/akun premium di social media Indonesia.

PRODUK LO: Akun/produk digital premium (kayak AWS credit, akun streaming, software, dll)
ORDER VIA: ${orderContact || 'Telegram'}

FRAMEWORK KONTEN:
1. HOOK: Mulai dari problem/pain point yang relate (misal "mahasiswa butuh cloud server tapi mahal", "pengen tools premium tapi budget tipis")
2. VALUE: Tunjukin value/benefit produk digital lo (hemat berapa, dapet apa)
3. TRUST: Sisipin trust signal (garansi, fast delivery, ready stock, udah banyak yang order)
4. CTA: Order via ${orderContact || 'Telegram'} — jelas dan langsung

KARAKTER NULIS:
- Casual tapi meyakinkan
- Bahasa Indo gaul: "gue", "lo", "bgt", "gak"
- Emphasize MURAH + LEGIT + FAST
- JANGAN: "merupakan", "menawarkan", "sangat"
- Buat orang FOMO + trust

${isIG ? 'FORMAT IG: 4-6 baris, 8-15 hashtag' : 'FORMAT THREADS: 2-3 baris PENDEK aja, 3 hashtag. TOTAL MAX 400 KARAKTER.'}

WAJIB:
- Sebutin harga HANYA kalau dikasih di info produk. JANGAN NGARANG HARGA.
- CTA WAJIB ada: "order via Telegram ${orderContact}" — tulis LENGKAP "order via Telegram ${orderContact}" biar orang tau harus cari di Telegram, bukan di Threads
- Trust signal (garansi/ready/fast)
- JANGAN bikin harga sendiri kalau gak dikasih

OUTPUT: Langsung caption aja. 1 post.` : `Kamu copywriter Threads/Instagram Indonesia yang ngerti soft selling affiliate.

FRAMEWORK KONTEN LO (WAJIB DIIKUTI):
1. HOOK: Mulai dari problem/keresahan yang relate sama target audiens. JANGAN mulai dari produk.
2. CERITA/INSIGHT: Kasih 1-2 kalimat cerita singkat atau insight yang bikin orang ngerasa "gue banget"
3. PRODUK MASUK: Produk muncul NATURAL sebagai solusi, BUKAN sebagai iklan. Kayak "eh ternyata nemu ini" atau "temen gue recommend" 
4. CTA: Santai, gak norak, arahkan ke bio

KARAKTER NULIS LO:
- Kayak curhat/ngobrol ke temen — BUKAN kayak copywriting/iklan
- Bahasa: Indo gaul, "gue/gw", "lo", "bgt", "gak", "emg", "anjir"  
- Kadang typo/singkatan natural
- JANGAN PERNAH: "merupakan", "menawarkan", "sangat", "sempurna", "luar biasa"
- JANGAN keliatan jualan — orang harus merasa lo lagi cerita, bukan promosi

${isIG ? `FORMAT IG:
- 4-6 baris caption
- 8-15 hashtag di akhir
- Slightly more polished tapi tetep casual` : `FORMAT THREADS:
- 2-4 baris aja (pendek, punchy)
- 3-5 hashtag di akhir
- Super casual kayak tweet`}

HASHTAG RULES (PENTING):
- Hashtag PERTAMA = jadi TOPIC di Threads. Harus paling relate sama isi caption & paling menarik perhatian.
- Contoh hashtag pertama yang bagus: #cuan, #tipshemat, #sidehustle, #rahasia, #lifehack
- Sisanya hashtag niche produk

BATAS KARAKTER: TOTAL caption + hashtag WAJIB di bawah 400 karakter. PENDEK. Kalo kepanjangan = GAGAL. Lebih baik pendek tapi impactful.

HOOK VARIASI (WAJIB BEDA-BEDA tiap generate):
- Angle CUAN/PROFIT: "cara gue hemat xxx", "ini sih celah cuan", "duit lo bisa lebih irit"
- Angle KEBUTUHAN: "lo pasti butuh ini kalo...", "buat yg sering [problem]"
- Angle PROBLEM SOLVER: "capek [masalah]? gue nemu solusinya"
- Angle FOMO: "orang udah pada tau ini, lo kapan?"
- PRIORITAS: angle cuan/profit/bisnis paling engage — sering pake ini tapi tetep rotate

WAJIB:
- TANPA link URL di caption
- Arahkan ke bio: variasi dari "link di bio nomer ${linkNumber || 'X'}" tapi natural (misal "cek bio gue nomer ${linkNumber}" atau "ada di bio nomer ${linkNumber} btw")
- Jangan selalu format sama — kreatif

OUTPUT: Langsung caption aja. 1 post (jangan split).`

  const userPrompt = `Bikin caption ${platform || 'Threads'} buat produk: ${productName}${price ? ` (${price})` : ''}${discount ? ` ${discount}` : ''}${description ? ` - ${description}` : ''}

Style: ${style || 'review'}
${style === 'review' ? '→ Lo lagi cerita ke temen soal barang ini, mulai dari problem lo sebelumnya' : style === 'promo' ? '→ Lo excited nemu deal bagus, mulai dari keresahan harga mahal' : '→ Mini storytelling, mulai dari situasi sehari-hari yang relate'}

Bio nomer: ${linkNumber || '1'}
Inget: problem/relate DULU → produk masuk natural → CTA bio. Jangan langsung jualan.`

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
        max_tokens: 200,
        temperature: 0.85,
      }),
    })

    if (!res.ok) {
      const err = await res.text()
      return NextResponse.json({ error: 'AI request failed', detail: err }, { status: 502 })
    }

    const data = await res.json()
    let caption = data.choices?.[0]?.message?.content || ''

    // Force cap at 480 chars — always ensure complete caption
    if (caption.length > 480) {
      // Extract hashtags from full caption
      const allHashtags = caption.match(/#\w+/g) || []
      const tags = allHashtags.slice(0, 3).join(' ')

      // Get caption without hashtags
      const captionWithoutTags = caption.replace(/#\w+/g, '').trim()

      // Cut caption body to fit within limit (leave room for tags)
      const maxBodyLen = 480 - tags.length - 4 // 4 for \n\n spacing
      let body = captionWithoutTags.slice(0, maxBodyLen)

      // Cut at last sentence end
      const lastEnd = Math.max(body.lastIndexOf('.'), body.lastIndexOf('!'), body.lastIndexOf('?'), body.lastIndexOf('\n'))
      if (lastEnd > maxBodyLen * 0.5) {
        body = body.slice(0, lastEnd + 1)
      }

      caption = body.trim() + '\n\n' + tags
    }

    return NextResponse.json({ caption })
  } catch (err: any) {
    return NextResponse.json({ error: 'AI error', message: err.message }, { status: 500 })
  }
}
