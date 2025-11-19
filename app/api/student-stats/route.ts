import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// إجبار هذا الـ API ليكون ديناميكياً دائماً في Next.js وتفادي أخطاء DYNAMIC_SERVER_USAGE
export const dynamic = 'force-dynamic'

/**
 * واجهة API لإحصائيات الطالب
 * تقوم بجلب إحصائيات المشاهدات والدراسة للطالب
 */
export async function GET(req: NextRequest) {
  try {
    // الحصول على معرف المستخدم من طلب الواجهة
    const userStr = req.headers.get('x-user-data') || req.cookies.get('user')?.value || ''
    const headerUserId = req.headers.get('x-user-id') || ''
    
    let userId: string | null = null
    if (userStr) {
      try {
        if (userStr.trim().startsWith('{')) {
          const userData = JSON.parse(userStr)
          userId = userData?.id || null
        } else {
          // إذا كانت القيمة ليست JSON اعتبرها مباشرة معرف مستخدم محتمل
          userId = userStr
        }
      } catch {
        // تجاهل خطأ التحليل وسنحاول طرقاً أخرى
      }
    }
    if (!userId && headerUserId) userId = headerUserId
    
    if (!userId) {
      return NextResponse.json({ error: 'غير مصرح، يرجى تسجيل الدخول' }, { status: 401 })
    }
    
    // التحقق من وجود معرف المستخدم
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }
    
    // 1. إحصائيات المشاهدات
    const { data: viewsRaw, error: viewsError } = await supabaseAdmin
      .from('views')
      .select(`
        *,
        lectures(id, title, subject_id, order_index, thumbnail_url),
        lecture_content(id, title, type)
      `)
      .eq('user_id', userId)
      .order('last_viewed_at', { ascending: false })
    const viewsData = viewsRaw || []
    if (viewsError) {
      console.warn('Views not available, defaulting to empty:', viewsError?.message || viewsError)
    }
    
    // 2. إجمالي المحاضرات المتاحة
    const { data: totalLecturesRaw, error: lecturesError } = await supabaseAdmin
      .from('lectures')
      .select('id')
      .eq('is_active', true)
    const totalLectures = totalLecturesRaw || []
    if (lecturesError) {
      console.warn('Lectures not available, defaulting to empty:', lecturesError?.message || lecturesError)
    }
    
    // 3. إجمالي محتويات المحاضرات المتاحة
    const { data: totalContentRaw, error: contentError } = await supabaseAdmin
      .from('lecture_content')
      .select('id')
    const totalContent = totalContentRaw || []
    if (contentError) {
      console.warn('Lecture content not available, defaulting to empty:', contentError?.message || contentError)
    }
    
    // 4. إحصائيات المواد الدراسية (عدد المشاهدات لكل مادة)
    const { data: subjectsRaw, error: subjectsError } = await supabaseAdmin
      .from('subjects')
      .select(`
        id, 
        title,
        image_url,
        lectures!inner(
          id,
          views!inner(id, user_id)
        )
      `)
      .eq('lectures.views.user_id', userId)
    const subjects = subjectsRaw || []
    if (subjectsError) {
      console.warn('Subjects stats not available, continuing:', subjectsError?.message || subjectsError)
    }
    
    // 5. آخر المشاهدات للطالب (آخر 5)
    const recentViews = (viewsData as any[])?.slice(0, 5) || []
    
    // 6. حساب مقاييس المشاهدة للطالب
    const uniqueLectureIds = new Set((viewsData as any[])?.map((view: any) => view.lecture_id) || [])
    const uniqueContentIds = new Set((viewsData as any[])?.filter((view: any) => view.content_id).map((view: any) => view.content_id) || [])
    const completedViews = (viewsData as any[])?.filter((view: any) => view.completed) || []
    
    const totalViewTime = (viewsData as any[])?.reduce((sum: number, view: any) => sum + (view.total_time_watched || 0), 0) || 0
    
    // حساب معدل المشاهدة (النسبة المئوية للمشاهدة من إجمالي المحتوى)
    const completionRate = totalLectures && totalLectures.length > 0
      ? (uniqueLectureIds.size / totalLectures.length) * 100
      : 0
    
    // 7. جمع الإحصائيات النهائية
    const stats = {
      total_views: viewsData?.length || 0,
      unique_lectures_viewed: uniqueLectureIds.size,
      unique_content_viewed: uniqueContentIds.size,
      completed_views: completedViews.length,
      total_view_time_minutes: Math.round(totalViewTime / 60), // تحويل من ثواني إلى دقائق
      total_available_lectures: totalLectures?.length || 0,
      total_available_content: totalContent?.length || 0,
      completion_rate: Math.round(completionRate), // النسبة المئوية للإكمال
      subject_progress: subjects || []
    }
    
    return NextResponse.json({
      success: true,
      stats,
      recent_views: recentViews,
      all_views: viewsData
    })
    
  } catch (error: any) {
    console.error('Student stats API error (fallback to empty stats):', error)
    // إرجاع إحصائيات فارغة بدلاً من 500 حتى لا تنكسر الواجهة
    return NextResponse.json({
      success: true,
      stats: {
        total_views: 0,
        unique_lectures_viewed: 0,
        unique_content_viewed: 0,
        completed_views: 0,
        total_view_time_minutes: 0,
        total_available_lectures: 0,
        total_available_content: 0,
        completion_rate: 0,
        subject_progress: []
      },
      recent_views: [],
      all_views: []
    })
  }
}
