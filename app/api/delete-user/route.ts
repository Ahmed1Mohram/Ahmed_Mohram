import { NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function DELETE(request: Request) {
  try {
    console.log('طلب حذف مستخدم...');
    
    // التحقق من وجود رمز المصادقة
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('خطأ: رمز المصادقة غير موجود');
      return NextResponse.json({ 
        error: 'المصادقة مطلوبة', 
        details: 'يجب توفير رمز المصادقة في رأس الطلب' 
      }, { status: 401 });
    }
    
    // استخراج الرمز
    const token = authHeader.split(' ')[1];
    console.log('تم استلام رمز المصادقة');
    
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    console.log('التحقق من جلسة المستخدم...');
    
    // التحقق من أن المستخدم الحالي هو أدمن
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      console.log('خطأ: لا يوجد جلسة تسجيل دخول');
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول' },
        { status: 401 }
      )
    }
    
    // التحقق من أن المستخدم مسؤول
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_admin, email')
      .eq('id', session.user.id)
      .single();
      
    console.log('بيانات المستخدم الحالي:', userData);

    // التحقق من أن المستخدم مسؤول - إما من خلال حقل is_admin أو بريده ينتهي بـ @admin.com
    const isAdmin = userData?.is_admin === true || session.user.email?.endsWith('@admin.com');
    
    if (!isAdmin) {
      console.log('خطأ: المستخدم ليس مسؤولاً');
      return NextResponse.json(
        { error: 'مسموح فقط للمسؤولين' },
        { status: 403 }
      )
    }
    
    console.log('تم التحقق من صلاحيات المسؤول.');

    // حذف بيانات المستخدم من جدول users
    const { error: deleteUserError } = await supabase
      .from('users')
      .delete()
      .eq('id', userId)

    if (deleteUserError) {
      console.error('خطأ في حذف المستخدم:', deleteUserError)
      return NextResponse.json(
        { error: 'فشل حذف المستخدم', details: deleteUserError.message },
        { status: 500 }
      )
    }

    // حذف طلبات الدفع الخاصة بالمستخدم
    await supabase
      .from('payment_requests')
      .delete()
      .eq('user_id', userId)

    // حذف الاشتراكات الخاصة بالمستخدم
    await supabase
      .from('subscriptions')
      .delete()
      .eq('user_id', userId)

    // محاولة حذف المستخدم من Auth (اختياري)
    try {
      // استخدام مفتاح الخدمة لحذف المستخدم
      const { error: authDeleteError } = await supabase.auth.admin.deleteUser(userId)
      if (authDeleteError) {
        throw authDeleteError
      } else {
        console.log('تم حذف المستخدم من Auth بنجاح')
      }
    } catch (authError) {
      console.log('تحذير: لم نتمكن من حذف المستخدم من Auth:', authError)
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
