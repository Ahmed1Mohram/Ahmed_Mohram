import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/db-client'

export async function DELETE(request: NextRequest) {
  try {
    console.log('طلب حذف مستخدم...')

    // التحقق من أن الطلب صادر من أدمن عبر كوكي isAdmin
    const cookieStore = cookies()
    const adminCookie = cookieStore.get('isAdmin')
    const isAdmin = adminCookie?.value === 'true'

    if (!isAdmin) {
      console.log('خطأ: محاولة حذف بدون صلاحيات أدمن')
      return NextResponse.json(
        { error: 'مسموح فقط للمسؤولين' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    console.log('جاري حذف المستخدم وجميع بياناته المرتبطة:', userId)

    // حذف طلبات الدفع الخاصة بالمستخدم
    await supabaseAdmin
      .from('payment_requests')
      .delete()
      .eq('user_id', userId)

    // حذف الاشتراكات الخاصة بالمستخدم
    await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    // حذف بيانات المستخدم من جدول users
    const { error: deleteUserError } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteUserError) {
      console.error('خطأ في حذف المستخدم من جدول users:', deleteUserError)
      return NextResponse.json(
        { error: 'فشل حذف المستخدم', details: deleteUserError.message },
        { status: 500 }
      )
    }

    // محاولة حذف المستخدم من Auth (للسماح بالتسجيل من جديد بنفس البيانات)
    try {
      const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
      if (authDeleteError) {
        console.log('تحذير: لم نتمكن من حذف المستخدم من Auth:', authDeleteError)
      } else {
        console.log('تم حذف المستخدم من Auth بنجاح')
      }
    } catch (authError) {
      console.log('تحذير: استثناء أثناء حذف المستخدم من Auth:', authError)
      // نكمل حتى لو فشل حذف Auth
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف المستخدم بنجاح'
    })

  } catch (error) {
    console.error('خطأ في حذف المستخدم:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف المستخدم' },
      { status: 500 }
    )
  }
}
