import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
import { ensureMessagesTable } from '@/lib/chat-util'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function GET(req: NextRequest) {
  await ensureMessagesTable()
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId')
  if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 })

  const markRead = searchParams.get('markRead') === '1'
  const markReadUser = searchParams.get('markReadUser') === '1'
  const { data, error } = await supabaseAdmin
    .from('messages')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (markRead && isAdmin(req)) {
    await supabaseAdmin
      .from('messages')
      .update({ read_by_admin: true })
      .eq('user_id', userId)
      .eq('sender', 'user')
  }
  if (markReadUser) {
    await supabaseAdmin
      .from('messages')
      .update({ read_by_user: true })
      .eq('user_id', userId)
      .eq('sender', 'admin')
  }

  return NextResponse.json({ messages: data || [] })
}

export async function POST(req: NextRequest) {
  await ensureMessagesTable()
  const body = await req.json()
  const userId = body.userId as string
  const sender = body.sender as 'admin' | 'user'
  const text = (body.text as string || '').trim()
  if (!userId || !sender || !text) return NextResponse.json({ error: 'invalid' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('messages')
    .insert({ user_id: userId, sender, text, read_by_user: sender === 'admin' ? false : true, read_by_admin: sender === 'user' ? false : true })
    .select('*')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const message = data?.[0]

  // إنشاء إشعار في زر الإشعارات عند إرسال رسالة من الأدمن للطالب
  if (message && sender === 'admin') {
    try {
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: userId,
          type: 'admin_message',
          title: 'رسالة جديدة من أحمد محرم',
          message: text,
          is_read: false,
        })
    } catch {
      // تجاهل خطأ الإشعارات حتى لا يكسر إرسال الرسالة الأساسية
    }
  }

  return NextResponse.json({ message })
}
