import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
import * as bcrypt from 'bcryptjs'

// دالة للتحقق من صحة تنسيق UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// طباعة معلومات تشخيصية
console.log('API تسجيل الدخول المباشر تم تحميله');

 

export async function POST(req: NextRequest) {
  try {
    const { identifier, password, isPhone } = await req.json()
    console.log('تسجيل الدخول بـ:', { identifier, isPhone })
    
    // مسار خاص لتسجيل دخول الأدمن باسم أحمد محرم بدون البحث في قاعدة البيانات
    if (isPhone && identifier === 'أحمد محرم') {
      console.log('استخدام مسار تسجيل دخول الأدمن السريع للمطور أحمد محرم')
      
      const sessionData = {
        user: {
          id: 'admin-direct',
          email: 'admin@example.com',
          full_name: 'أحمد محرم',
          phone_number: null,
          role: 'admin',
          status: 'approved',
          subscription_status: 'active'
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      
      const successResponse = NextResponse.json({
        success: true,
        user: sessionData.user,
        session: sessionData,
        message: 'تم تسجيل الدخول كأدمن (وضع المطور)'
      })
      const maxAge = 24 * 60 * 60
      successResponse.cookies.set('loggedIn', 'true', { path: '/', maxAge, sameSite: 'lax' })
      successResponse.cookies.set('role', encodeURIComponent(sessionData.user.role || 'admin'), { path: '/', maxAge, sameSite: 'lax' })
      successResponse.cookies.set('status', encodeURIComponent(sessionData.user.status || 'approved'), { path: '/', maxAge, sameSite: 'lax' })
      successResponse.cookies.set('subscription_status', encodeURIComponent(sessionData.user.subscription_status || 'active'), { path: '/', maxAge, sameSite: 'lax' })
      return successResponse
    }
    
    // التحقق من وجود جدول المستخدمين قبل البحث
    try {
      let userData = null;
      let userQueryError = null;
      
      // محاولة البحث في جدول المستخدمين
      try {
        console.log('بدء البحث عن المستخدم:', identifier);
        
        const query = supabaseAdmin
          .from('users')
          .select('*')
          .eq(isPhone ? 'phone_number' : 'email', identifier);
        
        const { data, error } = await query.maybeSingle();
        userData = data;
        userQueryError = error;
      } catch (queryError) {
        console.error('Error querying users table:', queryError);
        userQueryError = queryError;
      }
      
      // إذا وجد المستخدم وليس هناك خطأ
      if (userData && !userQueryError) {
        // التحقق من كلمة المرور
        if (!userData.password_hash) {
          // إذا لم يكن للمستخدم كلمة مرور مخزنة، نقوم بتخزينها
          const hashedPassword = await bcrypt.hash(password, 10);
          await supabaseAdmin
            .from('users')
            .update({ password_hash: hashedPassword })
            .eq('id', userData.id);
        } else {
          // التحقق من تطابق كلمة المرور
          const isValid = await bcrypt.compare(password, userData.password_hash);
          if (!isValid) {
            return NextResponse.json(
              { error: 'كلمة المرور غير صحيحة' },
              { status: 401 }
            );
          }
        }
        
        // طباعة بيانات المستخدم
        console.log('تم العثور على المستخدم:', {
          id: userData.id,
          email: userData.email,
          phone_number: userData.phone_number,
          status: userData.status,
          subscription_status: userData.subscription_status
        });
        
        // التحقق من حالة المستخدم
        if (userData.status === 'banned') {
          console.log('المستخدم محظور');
          return NextResponse.json(
            { error: 'هذا الحساب محظور' },
            { status: 403 }
          );
        }
        
        // إذا كان المستخدم في وضع الانتظار، نسمح له بالدخول أيضًا
        if (userData.status === 'pending') {
          console.log('المستخدم في وضع الانتظار، سيتم تطبيق القيود من خلال middleware وصفحات الانتظار');
        }
        
        // التحقق من الجهاز قبل إنشاء الجلسة
        try {
          const verifyResponse = await fetch(new URL('/api/verify-device', req.url), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'User-Agent': req.headers.get('user-agent') || '',
              'x-forwarded-for': req.headers.get('x-forwarded-for') || '',
              'x-real-ip': req.headers.get('x-real-ip') || '',
              'accept-language': req.headers.get('accept-language') || '',
              'accept-encoding': req.headers.get('accept-encoding') || ''
            },
            body: JSON.stringify({ userId: userData.id })
          });
          const verifyResult = await verifyResponse.json();
          if (!verifyResponse.ok || verifyResult.allowed === false) {
            return NextResponse.json(
              { error: verifyResult.message || 'غير مسموح بتسجيل الدخول من هذا الجهاز' },
              { status: 403 }
            );
          }
        } catch (deviceError) {
          console.error('Device verification error:', deviceError);
          // في حالة خطأ في التحقق نمنع الدخول حفاظاً على السياسة
          return NextResponse.json(
            { error: 'تعذر التحقق من الجهاز' },
            { status: 403 }
          );
        }
        
        // إنشاء جلسة للمستخدم
        const sessionData = {
          user: {
            id: userData.id,
            email: userData.email,
            full_name: userData.full_name,
            phone_number: userData.phone_number,
            role: userData.role,
            status: userData.status,
            subscription_status: userData.subscription_status
          },
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        console.log('تم إنشاء جلسة للمستخدم بنجاح');
        
        const successResponse = NextResponse.json({
          success: true,
          user: sessionData.user,
          session: sessionData,
          message: 'تم تسجيل الدخول بنجاح!'
        })
        const maxAge = 24 * 60 * 60
        successResponse.cookies.set('loggedIn', 'true', { path: '/', maxAge, sameSite: 'lax' })
        successResponse.cookies.set('role', encodeURIComponent(sessionData.user.role || 'student'), { path: '/', maxAge, sameSite: 'lax' })
        successResponse.cookies.set('status', encodeURIComponent(sessionData.user.status || 'pending'), { path: '/', maxAge, sameSite: 'lax' })
        successResponse.cookies.set('subscription_status', encodeURIComponent(sessionData.user.subscription_status || 'inactive'), { path: '/', maxAge, sameSite: 'lax' })
        return successResponse
      } else {
        // إذا لم يتم العثور على المستخدم أو حدث خطأ في الاستعلام
        console.log('User not found or error during query:', userQueryError);
        return NextResponse.json(
          { error: 'بيانات الدخول غير صحيحة' },
          { status: 401 }
        );
      }
    } catch (dbError) {
      console.error('Error accessing database:', dbError);
      return NextResponse.json(
        { error: 'تعذر الاتصال بقاعدة البيانات، حاول مرة أخرى لاحقاً' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    );
  }
}
