import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const body = await request.json()
    const { userId, examId, answers, durationSeconds } = body || {}

    if (!examId || !answers) {
      return NextResponse.json({ success: false, error: 'examId and answers are required' }, { status: 400 })
    }

    // حساب النتيجة بناءً على جدول الامتحانات
    let score: number | null = null
    try {
      const { data: examRow } = await supabaseAdmin
        .from('exams')
        .select('questions')
        .eq('id', examId)
        .maybeSingle()
      if (examRow && Array.isArray(examRow.questions)) {
        let s = 0
        const normalize = (v: any) => {
          if (v === undefined || v === null) return ''
          return String(v)
            .toLowerCase()
            .replace(/[\s\.,;:!؟،'"\-_\\/\(\)\[\]\{\}]+/g, '')
            .trim()
        }
        for (const q of examRow.questions) {
          const qid = q.id ?? q.qid
          const given = qid != null ? answers?.[qid] : undefined
          if (qid == null || given == null) continue
          const type = q.type || (Array.isArray(q.options) ? 'mcq' : undefined)
          if (type === 'tf') {
            const corrBool = typeof q.correct === 'boolean' ? q.correct : String(q.correct).toLowerCase() === 'true'
            const givenBool = typeof given === 'boolean' ? given : String(given).toLowerCase() === 'true'
            if (givenBool === corrBool) s += 1
          } else if (type === 'essay') {
            const acc: any[] = Array.isArray(q.acceptable) ? q.acceptable : []
            const g = normalize(given)
            if (acc.some(a => normalize(a) === g)) s += 1
          } else {
            // mcq or default string comparison
            if (String(given) === String(q.correct)) s += 1
          }
        }
        score = s
      }
    } catch {}

    const id = (globalThis as any).crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const created_at = new Date().toISOString()

    const record = {
      id,
      user_id: userId || null,
      exam_id: examId,
      answers: answers || {},
      score,
      duration_seconds: typeof durationSeconds === 'number' ? Math.max(0, Math.floor(durationSeconds)) : null,
      created_at,
    }

    let insertError: any = null
    try {
      const { error } = await supabaseAdmin.from('exam_submissions').insert(record as any)
      insertError = error
    } catch (e: any) {
      insertError = e
    }

    if (insertError) {
      const SQL = `
        CREATE TABLE IF NOT EXISTS exam_submissions (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          exam_id TEXT,
          answers JSONB,
          score NUMERIC,
          duration_seconds INT,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      try {
        await supabaseAdmin.rpc('exec', { sql: SQL })
      } catch (e) {
        // ignore
      }

      const { error: secondError } = await supabaseAdmin.from('exam_submissions').insert(record as any)
      if (secondError) {
        return NextResponse.json(
          { success: false, error: 'failed to save submission', details: secondError?.message || insertError?.message },
          { status: 500 }
        )
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
    const examId = url.searchParams.get('examId')
    const userId = url.searchParams.get('userId')

    let query = supabaseAdmin
      .from('exam_submissions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(isNaN(limit) ? 100 : limit)

    if (examId) query = query.eq('exam_id', examId)
    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query

    if (error) {
      return NextResponse.json({ success: true, submissions: [], error: error.message })
    }

    return NextResponse.json({ success: true, submissions: data || [] })
  } catch (error: any) {
    return NextResponse.json({ success: true, submissions: [] })
  }
}
