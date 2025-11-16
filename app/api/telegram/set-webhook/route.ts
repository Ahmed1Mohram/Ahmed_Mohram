import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const token = process.env.TELEGRAM_BOT_TOKEN
    if (!token) return NextResponse.json({ ok: false, error: 'BOT_TOKEN_MISSING' }, { status: 500 })

    // Determine public base URL
    const body = await req.json().catch(() => ({}))
    const explicitUrl: string | undefined = body?.publicUrl
    const headerProto = req.headers.get('x-forwarded-proto') || 'https'
    const headerHost = req.headers.get('x-forwarded-host') || req.headers.get('host') || ''
    const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL
    const baseUrl = explicitUrl || envUrl || (headerHost ? `${headerProto}://${headerHost}` : '')
    if (!baseUrl) return NextResponse.json({ ok: false, error: 'NO_PUBLIC_URL' }, { status: 500 })

    const webhookUrl = `${baseUrl.replace(/\/$/, '')}/api/telegram/webhook`
    const api = `https://api.telegram.org/bot${token}/setWebhook`
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: webhookUrl })
    })
    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data)
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
