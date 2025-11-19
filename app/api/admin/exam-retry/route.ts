import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId, examId, allowRetry } = body || {}

    if (!userId || !examId) {
      return NextResponse.json({ success: false, error: 'userId and examId are required' }, { status: 400 })
    }

    const { data: submission, error } = await supabaseAdmin
      .from('exam_submissions')
      .select('id, allow_retry')
      .eq('user_id', userId)
      .eq('exam_id', examId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !submission) {
      return NextResponse.json({ success: false, error: 'submission not found' }, { status: 404 })
    }

    const { error: updateError } = await supabaseAdmin
      .from('exam_submissions')
      .update({ allow_retry: !!allowRetry })
      .eq('id', submission.id)

    if (updateError) {
      return NextResponse.json({ success: false, error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'server error' }, { status: 500 })
  }
}
