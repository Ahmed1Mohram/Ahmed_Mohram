import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function GET(req: NextRequest) {
  const subjectId = new URL(req.url).searchParams.get('subjectId')
  if (!subjectId) return NextResponse.json({ error: 'subjectId required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('lectures').select('*').eq('subject_id', subjectId).order('order_index')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lectures: data || [] })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const body = await req.json()
  const { subject_id, title, description, duration_minutes, is_free, is_active, thumbnail_url, order_index } = body || {}
  if (!subject_id || !title) return NextResponse.json({ error: 'required fields missing' }, { status: 400 })
  const { data, error } = await supabaseAdmin
    .from('lectures')
    .insert({ subject_id, title, description, duration_minutes, is_free, is_active, thumbnail_url, order_index })
    .select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lecture: data?.[0] })
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const body = await req.json()
  const { id, ...fields } = body || {}
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data, error } = await supabaseAdmin.from('lectures').update(fields).eq('id', id).select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ lecture: data?.[0] })
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { error } = await supabaseAdmin.from('lectures').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
