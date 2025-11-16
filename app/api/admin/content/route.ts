import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function GET(req: NextRequest) {
  const lectureId = new URL(req.url).searchParams.get('lectureId')
  if (!lectureId) return NextResponse.json({ error: 'lectureId required' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('lecture_content')
    .select('*')
    .eq('lecture_id', lectureId)
    .order('order_index')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ items: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const body = await req.json()
  const { lecture_id, ...fields } = body || {}
  if (!lecture_id || !fields?.title || !fields?.type) return NextResponse.json({ error: 'required fields missing' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('lecture_content').insert({ lecture_id, ...fields }).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data?.[0] })
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const body = await req.json()
  const { id, ...fields } = body || {}
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('lecture_content').update(fields).eq('id', id).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data?.[0] })
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('lecture_content').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
