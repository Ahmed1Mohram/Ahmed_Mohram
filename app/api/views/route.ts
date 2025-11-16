import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// POST - تسجيل مشاهدة
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { lecture_id, content_id, progress } = body
    
    // الحصول على معرف المستخدم من الجلسة
    const userStr = req.headers.get('x-user-data') || 
                    req.cookies.get('user')?.value
    
    if (!userStr) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }
    
    let userId
    try {
      const userData = JSON.parse(userStr)
      userId = userData.id
    } catch {
      return NextResponse.json({ error: 'بيانات مستخدم غير صالحة' }, { status: 400 })
    }

    // التحقق من وجود مشاهدة سابقة
    const { data: existingView } = await supabaseAdmin
      .from('views')
      .select('*')
      .eq('user_id', userId)
      .eq('lecture_id', lecture_id)
      .eq('content_id', content_id || '')
      .single()

    if (existingView) {
      // تحديث المشاهدة الموجودة
      const { data: view, error } = await supabaseAdmin
        .from('views')
        .update({
          progress: progress || existingView.progress,
          last_viewed_at: new Date().toISOString(),
          total_time_watched: (existingView.total_time_watched || 0) + 1,
          completed: progress >= 90
        })
        .eq('id', existingView.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating view:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, view })
    } else {
      // إنشاء مشاهدة جديدة
      const { data: view, error } = await supabaseAdmin
        .from('views')
        .insert({
          user_id: userId,
          lecture_id,
          content_id: content_id || null,
          progress: progress || 0,
          completed: false,
          total_time_watched: 1
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating view:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ success: true, view })
    }
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - جلب إحصائيات المشاهدات للأدمن
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const lectureId = searchParams.get('lecture_id')
    const userId = searchParams.get('user_id')
    
    let query = supabaseAdmin.from('views').select(`
      *,
      users(full_name, email),
      lectures(title),
      lecture_content(title, type)
    `)

    if (lectureId) {
      query = query.eq('lecture_id', lectureId)
    }
    
    if (userId) {
      query = query.eq('user_id', userId)
    }

    const { data: views, error } = await query.order('last_viewed_at', { ascending: false })

    if (error) {
      console.error('Error fetching views:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // حساب الإحصائيات
    const stats = {
      total_views: views?.length || 0,
      completed_views: views?.filter(v => v.completed).length || 0,
      average_progress: views?.reduce((acc, v) => acc + (v.progress || 0), 0) / (views?.length || 1),
      total_watch_time: views?.reduce((acc, v) => acc + (v.total_time_watched || 0), 0)
    }

    return NextResponse.json({
      success: true,
      views,
      stats
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
