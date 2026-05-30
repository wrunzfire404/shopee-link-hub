import { NextResponse } from 'next/server'
import { isAuthenticated } from '@/lib/auth'

const AI_API_URL = process.env.AI_API_URL || ''
const AI_API_KEY = process.env.AI_API_KEY || process.env.WAVESPEED_API_KEY || ''
const AI_MODEL = process.env.AI_MODEL || ''

export async function GET() {
  const authenticated = await isAuthenticated()
  if (!authenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!AI_API_URL || !AI_API_KEY) {
    return NextResponse.json({
      error: 'AI not configured',
      hasUrl: !!AI_API_URL,
      hasKey: !!AI_API_KEY,
      model: AI_MODEL,
      urlPrefix: AI_API_URL.slice(0, 40),
    })
  }

  try {
    const res = await fetch(AI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: AI_MODEL,
        messages: [{ role: 'user', content: 'Say OK' }],
        max_tokens: 10,
      }),
    })

    const text = await res.text()
    return NextResponse.json({
      status: res.status,
      model: AI_MODEL,
      url: AI_API_URL.slice(0, 50),
      response: text.slice(0, 300),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, model: AI_MODEL, url: AI_API_URL.slice(0, 50) })
  }
}
