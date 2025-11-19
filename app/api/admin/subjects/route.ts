import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function GET() {
  const { data, error } = await supabaseAdmin.from('subjects').select('*').order('order_index')
  if (error) {
    // لا نكسر لوحة الأدمن بسبب خطأ في Supabase (مثل Invalid API key)
    // نرجع قائمة مواد فارغة بدلاً من 500 حتى تستمر الواجهة
    return NextResponse.json({
      success: true,
      subjects: [],
      error: error.message
    })
  }
  return NextResponse.json({ success: true, subjects: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const body = await req.json()
  const { title, description, image_url, color, is_premium, is_active, order_index } = body || {}
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('subjects')
    .insert({ title, description, image_url, color, is_premium, is_active, order_index })
    .select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subject: data?.[0] })
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const body = await req.json()
  const { id, ...fields } = body || {}
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('subjects').update(fields).eq('id', id).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ subject: data?.[0] })
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('subjects').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
