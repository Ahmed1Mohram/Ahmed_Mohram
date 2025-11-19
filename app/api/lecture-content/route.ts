import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// إجبار هذا الـ API ليكون ديناميكياً دائماً في Next.js وتفادي أخطاء DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic'

/**
 * واجهة API مخصصة لجلب محتوى المحاضرات
 * تم إضافتها لحل مشكلة عرض المحتوى للمستخدمين 
 */
export async function GET(req: NextRequest) {
  try {
    // جلب معرف المحاضرة من الاستعلام
    const url = new URL(req.url)
    const lectureId = url.searchParams.get('lecture_id')
    
    if (!lectureId) {
      return NextResponse.json({ error: 'lecture_id is required' }, { status: 400 })
    }
    
    console.log(`جاري جلب محتوى المحاضرة بمعرف: ${lectureId}`)
    
    // جلب محتويات المحاضرة من قاعدة البيانات باستخدام عميل السيرفر
    const { data, error } = await supabaseAdmin
      .from('lecture_content')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('order_index')
    
    if (error) {
      console.error('خطأ في جلب محتوى المحاضرة (الاستعلام المباشر):', error)
    } else {
      console.log(`تم العثور على ${data?.length || 0} عنصر من محتوى المحاضرة (استعلام مباشر)`) 
    }

    // محاولة جلب المحتوى مباشرة بواسطة SQL لتخطي أي قيود على RLS
    let directData: any[] | null = null
    try {
      const { data: directResult, error: directError } = await supabaseAdmin.rpc('get_lecture_content', {
        lecture_id_param: lectureId
      })
      
      if (!directError && directResult) {
        directData = directResult as any[]
        console.log(`تم جلب المحتوى مباشرة باستخدام SQL: ${directResult.length} عنصر`)
      }
    } catch (err) {
      console.error('خطأ في استدعاء وظيفة SQL المخصصة:', err)
    }
    // اختيار المصدر الأفضل للبيانات:
    // إذا كان الاستعلام المباشر أعاد عناصر نستخدمها، وإلا نستخدم directData القادمة من الدالة SQL
    const items = (data && data.length ? data : (directData || []))
    const itemCount = items.length

    console.log(`Lecture ${lectureId} - سيتم إرجاع ${itemCount} عنصر للمستخدم (source = ${data && data.length ? 'direct_select' : 'sql_function'})`)

    return NextResponse.json({ 
      items,
      itemCount,
      directItems: directData,
      success: true
    })
    
  } catch (e: any) {
    console.error('خطأ غير متوقع في واجهة API محتوى المحاضرة:', e)
    return NextResponse.json({ error: e.message || 'خطأ غير معروف' }, { status: 500 })
  }
}
