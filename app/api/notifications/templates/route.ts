import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
import { defaultTemplates } from '@/lib/telegram'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function GET() {
  const { data } = await supabaseAdmin.from('notification_templates').select('*')
  const merged = { ...defaultTemplates }
  for (const row of data || []) merged[row.key] = row.template
  return NextResponse.json({ templates: merged })
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const { key, template } = await req.json()
  const { error } = await supabaseAdmin.from('notification_templates').upsert({ key, template })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
