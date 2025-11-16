import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
    const form = await req.formData()
    const file = form.get('file') as File | null
    const folder = (form.get('folder')?.toString() || 'misc').replace(/[^a-z0-9/_-]+/gi, '-')
    const lectureId = form.get('lectureId')?.toString()

    if (!file) return NextResponse.json({ error: 'FILE_REQUIRED' }, { status: 400 })

    // Ensure bucket exists (public)
    try { await (supabaseAdmin as any).storage.createBucket('media', { public: true }) } catch {}

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')
    const path = `${folder}${lectureId ? '/' + lectureId : ''}/${Date.now()}-${safeName}`

    const { error: upErr } = await supabaseAdmin.storage.from('media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: (file as any).type || undefined,
    })
    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 })

    const { data } = supabaseAdmin.storage.from('media').getPublicUrl(path)
    return NextResponse.json({ ok: true, bucket: 'media', path, url: data.publicUrl })
  } catch (e: any) {
    return NextResponse.json({ error: 'UPLOAD_ERROR' }, { status: 500 })
  }
}
