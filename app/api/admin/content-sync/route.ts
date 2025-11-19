import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

/**
 * واجهة API مخصصة لمزامنة محتوى المحاضرات وحل مشاكل عدم ظهورها للمستخدمين
 * تقوم بعملية فحص شاملة وإصلاح المشاكل تلقائياً
 */
export async function GET(req: NextRequest) {
  try {
    const isAdmin = req.headers.get('x-admin') === 'true' || 
                    req.headers.get('x-is-admin') === 'true'
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'غير مصرح لك بالوصول لهذه الواجهة' }, { status: 403 })
    }

    console.log('بدء مزامنة محتوى المحاضرات بين واجهتي الأدمن والمستخدم')

    // تعريف الأنواع لتجنب أخطاء TypeScript
    type DiagnosticItem = {
      stage: string;
      found: number;
      items: any[];
    }
    
    type FixItem = {
      stage: string;
      fixed: number | boolean;
      message: string;
    }
    
    type ErrorItem = {
      stage: string;
      error: string;
    }
    
    const results = {
      diagnostics: [] as DiagnosticItem[],
      fixes: [] as FixItem[],
      errors: [] as ErrorItem[]
    }

    // 1. التحقق من وجود محتوى محاضرات بدون محاضرات مرتبطة
    const { data: orphanedContent, error: orphanedError } = await supabaseAdmin
      .from('lecture_content')
      .select('id, title, lecture_id')
      .not('lecture_id', 'in', '(SELECT id FROM lectures)')

    if (orphanedError) {
      results.errors.push({
        stage: 'orphaned_content_check',
        error: orphanedError.message
      })
    } else {
      results.diagnostics.push({
        stage: 'orphaned_content_check',
        found: orphanedContent?.length || 0,
        items: orphanedContent
      })

      // إصلاح: حذف المحتوى بدون محاضرات مرتبطة
      if (orphanedContent && orphanedContent.length > 0) {
        const orphanedIds = orphanedContent.map((item: { id: string }) => item.id)
        const { error: deleteError } = await supabaseAdmin
          .from('lecture_content')
          .delete()
          .in('id', orphanedIds)

        if (deleteError) {
          results.errors.push({
            stage: 'orphaned_content_fix',
            error: deleteError.message
          })
        } else {
          results.fixes.push({
            stage: 'orphaned_content_fix',
            fixed: orphanedIds.length,
            message: `تم حذف ${orphanedIds.length} من محتويات المحاضرات بدون محاضرات مرتبطة`
          })
        }
      }
    }

    // 2. التأكد من وجود محتوى لكل محاضرة
    const { data: lecturesWithoutContent, error: lecturesError } = await supabaseAdmin
      .from('lectures')
      .select('id, title, subject_id')
      .not('id', 'in', '(SELECT DISTINCT lecture_id FROM lecture_content)')

    if (lecturesError) {
      results.errors.push({
        stage: 'lectures_without_content_check',
        error: lecturesError.message
      })
    } else {
      results.diagnostics.push({
        stage: 'lectures_without_content_check',
        found: lecturesWithoutContent?.length || 0,
        items: lecturesWithoutContent
      })
    }

    // 3. التحقق من صلاحيات الجداول
    try {
      await supabaseAdmin.rpc('fix_permissions', {});
      results.fixes.push({
        stage: 'permissions_fix',
        fixed: true,
        message: 'تم إصلاح صلاحيات الجداول'
      })
    } catch (permissionsError: any) {
      results.errors.push({
        stage: 'permissions_fix',
        error: permissionsError.message || 'خطأ غير معروف في إصلاح الصلاحيات'
      })
    }

    // 4. إعادة تحميل schema cache
    try {
      await supabaseAdmin.rpc('reload_schema', {});
      results.fixes.push({
        stage: 'reload_schema',
        fixed: true,
        message: 'تم إعادة تحميل schema cache'
      })
    } catch (reloadError: any) {
      results.errors.push({
        stage: 'reload_schema',
        error: reloadError.message || 'خطأ غير معروف في إعادة تحميل schema'
      })
    }

    return NextResponse.json({
      success: true,
      message: 'تمت عملية المزامنة بنجاح',
      ...results
    })

  } catch (e: any) {
    console.error('خطأ غير متوقع في واجهة مزامنة المحتوى:', e)
    return NextResponse.json({ 
      error: 'فشلت عملية المزامنة', 
      details: e.message 
    }, { status: 500 })
  }
}
