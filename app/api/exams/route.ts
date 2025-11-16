import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const url = new URL(req.url)
    const all = url.searchParams.get('all') === '1'
    const subjectId = url.searchParams.get('subjectId') || null

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
          created_at TIMESTAMPTZ DEFAULT NOW()
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
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      `
      await supabaseAdmin.rpc('exec', { sql: ALTER })
      try { await supabaseAdmin.rpc('reload_schema_cache'); } catch {}
    } catch {}

    let query = supabaseAdmin
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false })

    if (!all) {
      query = query.eq('is_published', true)
    }
    if (subjectId) query = query.eq('subject_id', subjectId)

    const { data, error } = await query
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    const exams = (data || []).map((e: any) => ({
      ...e,
      duration_minutes: e.duration_minutes ?? e.duration ?? 60,
      questions_count: Array.isArray(e.questions) ? e.questions.length : 0,
      questions: undefined, // do not send questions in list endpoint
    }))

    return NextResponse.json({ success: true, exams })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const body = await req.json()
    const { title, subject_id, duration_minutes, pass_threshold, is_published, questions } = body || {}

    if (!title || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ success: false, error: 'title and questions are required' }, { status: 400 })
    }

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
          created_at TIMESTAMPTZ DEFAULT NOW()
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
          ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
      `
      await supabaseAdmin.rpc('exec', { sql: ALTER })
      try { await supabaseAdmin.rpc('reload_schema_cache'); } catch {}
    } catch {}

    const id = (globalThis as any).crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const exam = {
      id,
      title,
      subject_id: subject_id || null,
      duration_minutes: Math.max(1, parseInt(duration_minutes || 60, 10)),
      duration: Math.max(1, parseInt(duration_minutes || 60, 10)),
      pass_threshold: Math.max(0, Math.min(100, parseInt(pass_threshold || 60, 10))),
      is_published: !!is_published,
      questions,
    }

    const { error } = await supabaseAdmin.from('exams').insert(exam as any)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, exam_id: id })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'Unknown error' }, { status: 500 })
  }
}
