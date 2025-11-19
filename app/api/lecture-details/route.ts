import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

/**
 * واجهة API لجلب تفاصيل محاضرة واحدة مع محتواها للمستخدمين العاديين
 * تستخدم supabaseAdmin مباشرة لتجاوز أي قيود على الصلاحيات
 */
export async function GET(req: NextRequest) {
  try {
    // نحصل على معرف المحاضرة من الاستعلام
    const url = new URL(req.url)
    const lectureId = url.searchParams.get('lecture_id')
    
    if (!lectureId) {
      return NextResponse.json({ error: 'lecture_id مطلوب' }, { status: 400 })
    }
    
    console.log(`جاري جلب تفاصيل المحاضرة: ${lectureId} باستخدام supabaseAdmin`)
    
    // 1. جلب تفاصيل المحاضرة
    const { data: lecture, error: lectureError } = await supabaseAdmin
      .from('lectures')
      .select(`
        *,
        subject:subjects(id, title)
      `)
      .eq('id', lectureId)
      .maybeSingle()
    
    if (lectureError) {
      console.error('خطأ في جلب المحاضرة:', lectureError)
      return NextResponse.json({ error: 'فشل جلب المحاضرة', details: lectureError.message }, { status: 500 })
    }
    
    // 2. جلب محتوى المحاضرة
    const { data: content, error: contentError } = await supabaseAdmin
      .from('lecture_content')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('order_index')
    
    if (contentError) {
      console.error('خطأ في جلب محتوى المحاضرة:', contentError)
      return NextResponse.json({ error: 'فشل جلب محتوى المحاضرة', details: contentError.message }, { status: 500 })
    }
    
    console.log(`تم جلب المحاضرة مع ${content?.length || 0} محتويات`)
    
    return NextResponse.json({ 
      lecture,
      content: content || []
    })
    
  } catch (e: any) {
    console.error('خطأ غير متوقع في واجهة API تفاصيل المحاضرة:', e)
    return NextResponse.json({ error: 'فشل جلب تفاصيل المحاضرة', details: e.message }, { status: 500 })
  }
}
