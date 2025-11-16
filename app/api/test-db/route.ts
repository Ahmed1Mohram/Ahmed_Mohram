import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// اختبار الاتصال بقاعدة البيانات الجديدة

export async function GET() {
  try {
    // محاولة الوصول للمستخدمين لاختبار الاتصال
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, role')
      .limit(1)
    
    if (error) {
      console.error('خطأ في الاتصال:', error)
      return NextResponse.json({
        success: false,
        message: 'فشل الاتصال بقاعدة البيانات',
        error: error.message
      }, { status: 500 })
    }
    
    // اختبار الجدول إذا لم يكن موجودًا
    if (!data || data.length === 0) {
      // إنشاء جدول المستخدمين إذا لم يكن موجودًا
      const createTable = await supabaseAdmin.rpc('create_users_if_not_exists')
      
      return NextResponse.json({
        success: true,
        message: 'لا يوجد مستخدمين في قاعدة البيانات - تم محاولة إنشاء الجدول',
        createTableResult: createTable
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'تم الاتصال بنجاح',
      testData: data
    })
  } catch (error: any) {
    console.error('خطأ في الاختبار:', error)
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ أثناء الاختبار',
      error: error.message || 'خطأ غير معروف'
    }, { status: 500 })
  }
}
