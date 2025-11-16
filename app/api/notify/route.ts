import { NextRequest, NextResponse } from 'next/server'
import { getTemplate, renderTemplate, telegramBroadcast } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    const { type, data } = await req.json()
    const tpl = await getTemplate(type)
    const text = renderTemplate(tpl, data || {})
    const result = await telegramBroadcast(text)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
