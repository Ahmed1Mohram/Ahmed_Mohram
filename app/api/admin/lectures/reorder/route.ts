import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const { id, subject_id, direction } = await req.json()
  if (!id || !subject_id || ![1, -1].includes(direction)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const { data: list } = await supabaseAdmin.from('lectures').select('id, order_index').eq('subject_id', subject_id).order('order_index')
  const arr = list as any[] || []
  const idx = arr.findIndex((x: any) => x.id === id)
  if (idx < 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const targetIdx = idx + direction
  if (targetIdx < 0 || targetIdx >= arr.length) return NextResponse.json({ ok: true })
  const a = arr[idx]
  const b = arr[targetIdx]
  const [u1, u2] = await Promise.all([
    supabaseAdmin.from('lectures').update({ order_index: b.order_index }).eq('id', a.id),
    supabaseAdmin.from('lectures').update({ order_index: a.order_index }).eq('id', b.id),
  ])
  if (u1.error || u2.error) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
