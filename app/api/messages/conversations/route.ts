import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  // Fetch last 500 messages and aggregate client-side
  const { data: msgs } = await supabaseAdmin
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(500)

  const byUser: Record<string, any[]> = {}
  for (const m of msgs || []) {
    byUser[m.user_id] = byUser[m.user_id] || []
    byUser[m.user_id].push(m)
  }
  const userIds = Object.keys(byUser)
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, full_name, email, phone_number')
    .in('id', userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'])

  const usersMap = new Map((users || []).map(u => [u.id, u]))

  const convs = userIds.map(uid => {
    const list = byUser[uid]
    const last = list[0]
    const unread = list.filter(m => m.sender === 'user' && !m.read_by_admin).length
    return {
      user: usersMap.get(uid) || { id: uid, full_name: 'مستخدم', email: '', phone_number: '' },
      lastMessage: last,
      unread,
    }
  })

  return NextResponse.json({ conversations: convs })
}
