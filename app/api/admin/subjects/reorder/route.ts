import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const { id, direction } = await req.json()
  if (!id || ![1, -1].includes(direction)) return NextResponse.json({ error: 'invalid' }, { status: 400 })
  const { data: list } = await supabaseAdmin.from('subjects').select('id, order_index').order('order_index')
  const idx = (list || []).findIndex((x: any) => x.id === id)
  if (idx < 0) return NextResponse.json({ error: 'not_found' }, { status: 404 })
  const targetIdx = idx + direction
  if (targetIdx < 0 || targetIdx >= (list || []).length) return NextResponse.json({ ok: true })
  const a = (list as any[])[idx]
  const b = (list as any[])[targetIdx]
  const [u1, u2] = await Promise.all([
    supabaseAdmin.from('subjects').update({ order_index: b.order_index }).eq('id', a.id),
    supabaseAdmin.from('subjects').update({ order_index: a.order_index }).eq('id', b.id),
  ])
  if (u1.error || u2.error) return NextResponse.json({ error: 'update_failed' }, { status: 500 })
  return NextResponse.json({ ok: true })
}
