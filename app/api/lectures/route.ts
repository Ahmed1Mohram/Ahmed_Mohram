import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/components/providers'

/**
 * واجهة API مخصصة لجلب المحاضرات للمستخدمين العاديين
 * تتجاوز أي مشاكل في الصلاحيات أو RLS
 */
export async function GET(req: NextRequest) {
  try {
    // نحصل على معلمات URL (استعلام)
    const url = new URL(req.url)
    const subjectId = url.searchParams.get('subject_id')
    
    console.log('طلب جلب المحاضرات', { subjectId })
    
    // الاستعلام الأساسي
    let query = supabase
      .from('lectures')
      .select(`
        *,
        subject:subjects(id, title)
      `)
      .order('order_index', { ascending: true })
    
    // إضافة فلتر الموضوع إن وجد
    if (subjectId) {
      query = query.eq('subject_id', subjectId)
    }
    
    // تنفيذ الاستعلام
    const { data, error } = await query
    
    if (error) {
      console.error('خطأ في جلب المحاضرات:', error)
      
      // نجرب طريقة بديلة باستخدام وظيفة SQL
      try {
        const { data: directData, error: directError } = await supabase.rpc('get_lectures', {
          subject_id_param: subjectId || null
        })
        
        if (directError) {
          return NextResponse.json({ error: 'فشل جلب المحاضرات', details: directError.message }, { status: 500 })
        }
        
        return NextResponse.json({ lectures: directData || [], count: directData?.length || 0 })
      } catch (fallbackError: any) {
        return NextResponse.json({ error: 'فشل جلب المحاضرات', details: fallbackError.message }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      lectures: data || [], 
      count: data?.length || 0 
    })
    
  } catch (e: any) {
    console.error('خطأ غير متوقع في واجهة API المحاضرات:', e)
    return NextResponse.json({ error: 'فشل جلب المحاضرات', details: e.message }, { status: 500 })
  }
}
