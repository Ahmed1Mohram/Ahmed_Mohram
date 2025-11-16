import { NextRequest, NextResponse } from 'next/server'
import { telegramBroadcast } from '@/lib/telegram'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  try {
    const { text } = await req.json()
    const result = await telegramBroadcast(text)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
