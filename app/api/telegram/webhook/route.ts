import { NextRequest, NextResponse } from 'next/server'
import { upsertSubscriber, setSubscription, telegramSendMessage, ensureTelegramTables } from '@/lib/telegram'

export async function POST(req: NextRequest) {
  try {
    await ensureTelegramTables()
    const update = await req.json()
    const msg = update?.message || update?.edited_message
    if (!msg) return NextResponse.json({ ok: true })
    const chatId = msg.chat?.id
    const text: string = (msg.text || '').trim()

    if (!chatId) return NextResponse.json({ ok: true })

    if (/^\/start/i.test(text) || /^(start|اشتراك)$/i.test(text)) {
      await upsertSubscriber(Number(chatId), msg.chat?.username)
      await telegramSendMessage(Number(chatId), '✅ تم الاشتراك في تنبيهات المنصة. اكتب /stop لإلغاء الاشتراك.')
      return NextResponse.json({ ok: true })
    }

    if (/^\/stop/i.test(text) || /^(الغاء|ايقاف)$/i.test(text)) {
      await setSubscription(Number(chatId), false)
      await telegramSendMessage(Number(chatId), '🛑 تم إيقاف التنبيهات. اكتب /start للاشتراك مرة أخرى.')
      return NextResponse.json({ ok: true })
    }

    // Echo/help
    await telegramSendMessage(Number(chatId), 'مرحباً 👋\nاكتب /start للاشتراك في تنبيهات الدورات والمحاضرات. اكتب /stop لإيقاف التنبيهات.')
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'WEBHOOK_ERROR' }, { status: 200 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
