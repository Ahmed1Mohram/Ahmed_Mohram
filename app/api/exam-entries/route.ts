import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const body = await req.json()
    const { userId, examId } = body || {}
    if (!examId) return NextResponse.json({ success: false, error: 'examId required' }, { status: 400 })

    try {
      const SQL = `
        CREATE TABLE IF NOT EXISTS exam_entries (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          exam_id TEXT,
          started_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabaseAdmin.rpc('exec', { sql: SQL })
    } catch {}

    const id = (globalThis as any).crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const row = { id, user_id: userId || null, exam_id: examId }
    const { error } = await supabaseAdmin.from('exam_entries').insert(row as any)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const url = new URL(req.url)
    const examId = url.searchParams.get('examId')
    const userId = url.searchParams.get('userId')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '200', 10), 500)

    try {
      const SQL = `
        CREATE TABLE IF NOT EXISTS exam_entries (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          exam_id TEXT,
          started_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabaseAdmin.rpc('exec', { sql: SQL })
    } catch {}

    let query = supabaseAdmin
      .from('exam_entries')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(isNaN(limit) ? 200 : limit)

    if (examId) query = query.eq('exam_id', examId)
    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query
    if (error) return NextResponse.json({ success: true, entries: [], error: error.message })

    return NextResponse.json({ success: true, entries: data || [] })
  } catch (e: any) {
    return NextResponse.json({ success: true, entries: [] })
  }
}
