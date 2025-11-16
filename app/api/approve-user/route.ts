import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// دالة للتحقق من صحة تنسيق UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// طباعة معلومات تشخيصية
console.log('API تفعيل الحساب تم تحميله');

 

/**
 * واجهة API لتفعيل حساب المستخدم
 * عندما يتم الموافقة على المستخدم من لوحة الأدمن،
 * يتم تحديث حالة الحساب إلى "approved" وتفعيل الاشتراك
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    // التحقق من وجود معرف المستخدم
    console.log('معرف المستخدم للتفعيل:', userId);
    
    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }
    
    // التحقق من صحة تنسيق UUID
    if (!isValidUUID(userId)) {
      console.error('تنسيق UUID غير صالح:', userId);
      return NextResponse.json(
        { error: 'معرف UUID غير صالح' },
        { status: 400 }
      )
    }
    
    // الحصول على بيانات المستخدم الحالية
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
      
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 404 }
      )
    }
    
    // تحديث حالة الحساب والاشتراك
    const updateData = {
      status: 'approved',
      subscription_status: 'active',
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 يوم من الآن
      updated_at: new Date().toISOString()
    }
    
    const { data: updatedUser, error: updateError } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()
      
    if (updateError) {
      console.error('خطأ في تحديث حالة المستخدم:', updateError);
      console.error('Complete error object:', JSON.stringify(updateError));
      return NextResponse.json(
        { error: 'فشل تحديث حالة المستخدم', details: updateError.message },
        { status: 500 }
      )
    }
    
    // إرسال إشعار للمستخدم
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'approval',
        title: 'تم تفعيل حسابك!',
        message: 'مرحباً! تم تفعيل حسابك بنجاح ويمكنك الآن الوصول إلى جميع الميزات المتاحة.',
        is_read: false,
        created_at: new Date().toISOString()
      })
    
    return NextResponse.json({
      success: true,
      message: 'تم تفعيل حساب المستخدم بنجاح',
      user: updatedUser
    })
    
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
