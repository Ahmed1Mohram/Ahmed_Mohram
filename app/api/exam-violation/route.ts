import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const body = await request.json()
    const { userId, examId, reason, meta, ts } = body || {}

    if (!examId || !reason) {
      return NextResponse.json({ success: false, error: 'examId and reason are required' }, { status: 400 })
    }

    const id = (globalThis as any).crypto?.randomUUID ? (globalThis as any).crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`
    const created_at = new Date(ts || Date.now()).toISOString()

    const record = {
      id,
      user_id: userId || null,
      exam_id: examId,
      reason,
      meta: meta || {},
      created_at,
    }

    // محاولة الإدراج مباشرة
    let insertError: any = null
    try {
      const { error } = await supabaseAdmin.from('exam_violations').insert(record as any)
      insertError = error
    } catch (e: any) {
      insertError = e
    }

    if (insertError) {
      // محاولة إنشاء الجدول ثم الإدراج مرة أخرى
      const SQL = `
        CREATE TABLE IF NOT EXISTS exam_violations (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          exam_id TEXT,
          reason TEXT,
          meta JSONB,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      try {
        await supabaseAdmin.rpc('exec', { sql: SQL })
      } catch (e) {
        // تجاهل خطأ إنشاء الجدول وسنحاول الإدراج على أية حال
      }

      const { error: secondError } = await supabaseAdmin.from('exam_violations').insert(record as any)
      if (secondError) {
        return NextResponse.json({ success: false, error: 'failed to log violation', details: secondError?.message || insertError?.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'server error' }, { status: 500 })
  }
}

export async function GET(request: Request) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const url = new URL(request.url)
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500)

    const { data, error } = await supabaseAdmin
      .from('exam_violations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(isNaN(limit) ? 100 : limit)

    if (error) {
      return NextResponse.json({ success: true, violations: [], error: error.message })
    }

    return NextResponse.json({ success: true, violations: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: true, violations: [] })
  }
}
