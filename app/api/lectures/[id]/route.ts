import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/components/providers'

/**
 * واجهة API مخصصة لجلب محاضرة واحدة مع محتواها للمستخدمين العاديين
 * تتجاوز أي مشاكل في الصلاحيات أو RLS
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const lectureId = params.id
    
    console.log('طلب جلب محاضرة بمعرف:', lectureId)
    
    // طريقة 1: استخدام supabase select
    const { data: lecture, error: lectureError } = await supabase
      .from('lectures')
      .select(`
        *,
        subject:subjects(id, title)
      `)
      .eq('id', lectureId)
      .maybeSingle()
    
    if (lectureError) {
      console.error('خطأ في جلب المحاضرة:', lectureError)
    }
    
    // جلب محتوى المحاضرة
    const { data: content, error: contentError } = await supabase
      .from('lecture_content')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('order_index')
    
    if (contentError) {
      console.error('خطأ في جلب محتوى المحاضرة:', contentError)
    }
    
    // إذا فشلت الطريقة الأولى، نستخدم وظيفة SQL مباشرة
    if (lectureError || contentError) {
      try {
        console.log('استخدام وظيفة SQL المباشرة لجلب المحاضرة')
        const { data: directData, error: directError } = await supabase.rpc('get_lecture_with_content', {
          lecture_id_param: lectureId
        })
        
        if (directError) {
          console.error('خطأ في وظيفة SQL المباشرة:', directError)
          return NextResponse.json({ error: 'فشل جلب المحاضرة', details: directError.message }, { status: 500 })
        }
        
        return NextResponse.json({ 
          lecture: directData,
          content: directData?.content || []
        })
      } catch (fallbackError: any) {
        console.error('خطأ غير متوقع في الوظيفة المباشرة:', fallbackError)
        return NextResponse.json({ error: 'فشل جلب المحاضرة', details: fallbackError.message }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      lecture,
      content: content || []
    })
    
  } catch (e: any) {
    console.error('خطأ غير متوقع في واجهة API المحاضرة الواحدة:', e)
    return NextResponse.json({ error: 'فشل جلب المحاضرة', details: e.message }, { status: 500 })
  }
}
