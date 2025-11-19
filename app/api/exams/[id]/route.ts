import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const id = params.id

    // Ensure table exists (best-effort)
    try {
      const SQL = `
        CREATE TABLE IF NOT EXISTS exams (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          subject_id TEXT,
          duration_minutes INT NOT NULL DEFAULT 60,
          pass_threshold INT NOT NULL DEFAULT 60,
          is_published BOOLEAN NOT NULL DEFAULT FALSE,
          questions JSONB NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabaseAdmin.rpc('exec', { sql: SQL })
      const ALTER = `
        ALTER TABLE IF EXISTS exams
          ADD COLUMN IF NOT EXISTS subject_id TEXT,
          ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 60,
          ADD COLUMN IF NOT EXISTS duration INT DEFAULT 60,
          ADD COLUMN IF NOT EXISTS pass_threshold INT DEFAULT 60,
          ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE,
          ADD COLUMN IF NOT EXISTS questions JSONB,
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
          ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        SELECT pg_notify('pgrst', 'reload schema');
      `
      await supabaseAdmin.rpc('exec', { sql: ALTER })
    } catch {}

    const { data, error } = await supabaseAdmin
      .from('exams')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return NextResponse.json({ success: false, error: error?.message || 'Not found' }, { status: 404 })

    return NextResponse.json({ success: true, exam: { ...data, duration_minutes: data.duration_minutes ?? data.duration ?? 60 } })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const id = params.id
    const body = await req.json()

    const updates: any = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.duration_minutes !== undefined) {
      const d = parseInt(body.duration_minutes)
      updates.duration_minutes = d
      updates.duration = d
    }
    if (body.pass_threshold !== undefined) updates.pass_threshold = parseInt(body.pass_threshold)
    if (body.is_published !== undefined) updates.is_published = !!body.is_published
    if (body.subject_id !== undefined) updates.subject_id = body.subject_id
    if (body.questions !== undefined) updates.questions = body.questions
    // Always bump updated_at on manual updates
    updates.updated_at = new Date().toISOString()

    const { error } = await supabaseAdmin.from('exams').update(updates).eq('id', id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
