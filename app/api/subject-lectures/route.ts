import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client' // نستخدم supabaseAdmin مباشرة هنا

// إجبار هذا الـ API ليكون ديناميكياً دائماً في Next.js وتفادي أخطاء DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic'

/**
 * واجهة API محسّنة لجلب محاضرات موضوع معين
 * تستخدم وظيفة SQL المخصصة get_subject_lectures لضمان ظهور المحتوى
 */
export async function GET(req: NextRequest) {
  try {
    // نحصل على معرف الموضوع من الاستعلام
    const url = new URL(req.url)
    const subjectId = url.searchParams.get('subject_id')
    
    if (!subjectId) {
      return NextResponse.json({ error: 'subject_id مطلوب' }, { status: 400 })
    }
    
    console.log(`جاري جلب محاضرات الموضوع: ${subjectId} باستخدام الوظيفة المخصصة`)
    
    // الطريقة الأولى: استخدام وظيفة SQL المخصصة التي تم إنشاؤها في fix-sync-issues.sql
    const { data: functionData, error: functionError } = await supabaseAdmin.rpc('get_subject_lectures', {
      subject_id_param: subjectId
    })
    
    if (!functionError && functionData && functionData.length > 0) {
      console.log(`تم جلب ${functionData.length} محاضرة للموضوع ${subjectId} باستخدام الوظيفة المخصصة`)
      return NextResponse.json({
        lectures: functionData,
        count: functionData.length,
        source: 'custom_function'
      })
    }
    
    // الطريقة الثانية: استخدام استعلام SQL مباشر مع exec_with_return
    console.log('استخدام استعلام SQL المباشر للمحاولة الثانية')
    
    const SQL = `
      SELECT 
        l.id,
        l.title,
        l.description,
        l.subject_id,
        l.order_index,
        l.duration_minutes,
        l.is_free,
        l.created_at,
        COUNT(lc.id) AS content_count,
        COALESCE(BOOL_OR(lc.type = 'video'), FALSE) AS has_video,
        COALESCE(BOOL_OR(lc.type = 'audio'), FALSE) AS has_audio,
        COALESCE(BOOL_OR(lc.type = 'pdf'), FALSE) AS has_pdf,
        COALESCE(BOOL_OR(lc.type = 'text'), FALSE) AS has_text,
        s.title AS subject_title
      FROM 
        lectures l
      LEFT JOIN 
        lecture_content lc ON l.id = lc.lecture_id
      LEFT JOIN
        subjects s ON l.subject_id = s.id
      WHERE 
        l.subject_id = '${subjectId}'
      GROUP BY 
        l.id, l.title, l.description, l.subject_id, l.order_index, l.duration_minutes, 
        l.is_free, l.created_at, s.title
      ORDER BY 
        l.order_index;
    `
    
    const { data: sqlData, error: sqlError } = await supabaseAdmin.rpc('exec_with_return', { 
      sql: SQL 
    })
    
    if (!sqlError && sqlData && sqlData.length > 0) {
      console.log(`تم جلب ${sqlData.length} محاضرة للموضوع ${subjectId} باستخدام SQL المباشر`)
      return NextResponse.json({ 
        lectures: sqlData,
        count: sqlData.length,
        source: 'direct_sql'
      })
    }
    
    // الطريقة الثالثة: استخدام supabaseAdmin مع select عادي
    console.log('استخدام supabaseAdmin العادي للمحاولة الثالثة')
    
    const { data: adminData, error: adminError } = await supabaseAdmin
      .from('lectures')
      .select('*, lecture_content(id, type)')
      .eq('subject_id', subjectId)
      .order('order_index')
    
    if (!adminError && adminData && adminData.length > 0) {
      const processedData = adminData.map((lecture: any) => ({
        ...lecture,
        content_count: lecture.lecture_content?.length || 0
      }))
      
      console.log(`تم جلب ${processedData.length} محاضرة للموضوع ${subjectId} باستخدام supabaseAdmin`)
      return NextResponse.json({ 
        lectures: processedData,
        count: processedData.length,
        source: 'admin_api'
      })
    }

    // إذا فشلت كل المحاولات السابقة، لا نُسقط الواجهة بخطأ 500
    // بدلاً من ذلك نرجع قائمة محاضرات فارغة مع تفاصيل للمطور فقط
    console.error('فشل جلب المحاضرات بعد عدة محاولات، سيتم إرجاع قائمة فارغة', {
      functionError,
      sqlError,
      adminError,
    })

    return NextResponse.json({ 
      lectures: [],
      count: 0,
      source: 'fallback_empty',
      error: 'تعذر جلب المحاضرات، سيتم عرض قائمة فارغة', 
      details: {
        functionError: functionError?.message,
        sqlError: sqlError?.message,
        adminError: adminError?.message,
      }
    }, { status: 200 })

  } catch (e: any) {
    console.error('خطأ غير متوقع في واجهة API المحاضرات، سيتم إرجاع قائمة فارغة:', e)

    // حتى في حالة الأخطاء غير المتوقعة، لا نرجع 500 حتى لا تنكسر صفحة الطالب
    return NextResponse.json({ 
      lectures: [],
      count: 0,
      source: 'catch_fallback',
      error: 'تعذر جلب المحاضرات حالياً، سيتم عرض قائمة فارغة',
      details: e?.message || String(e)
    }, { status: 200 })
  }
}
