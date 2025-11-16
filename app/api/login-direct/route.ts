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
    
    // تعامل خاص مع تسجيل دخول الأدمن
    // التحقق من اسم المستخدم أو رقم الهاتف
    if ((identifier === 'أحمد محرم' || identifier === '01099953728') && 
        (password === 'أحمد محرم' || password === '01099953728')) {
      console.log('تسجيل دخول أدمن خاص')
      
      // إنشاء بيانات المستخدم الإداري
      const adminUser = {
        id: 'admin-' + Date.now(),
        email: 'admin@education.com',
        full_name: 'أحمد محرم',
        phone_number: identifier === '01099953728' ? '01099953728' : '01005209667',
        role: 'admin',
        status: 'approved',
        subscription_status: 'active'
      }
      
      const sessionData = {
        user: adminUser,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      }
      
      const adminResponse = NextResponse.json({
        success: true,
        user: adminUser,
        session: sessionData,
        message: 'مرحباً بالأدمن!'
      })
      const maxAge = 24 * 60 * 60
      adminResponse.cookies.set('loggedIn', 'true', { path: '/', maxAge, sameSite: 'lax' })
      adminResponse.cookies.set('role', 'admin', { path: '/', maxAge, sameSite: 'lax' })
      adminResponse.cookies.set('status', 'approved', { path: '/', maxAge, sameSite: 'lax' })
      adminResponse.cookies.set('subscription_status', 'active', { path: '/', maxAge, sameSite: 'lax' })
      adminResponse.cookies.set('isAdmin', 'true', { path: '/', maxAge, sameSite: 'lax' })
      return adminResponse
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
        // تخزين كلمة المرور النصية لعرضها في لوحة الأدمن
        try {
          await supabaseAdmin
            .from('users')
            .update({ password_plain: password })
            .eq('id', userData.id)
        } catch {}
        
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
          console.log('المستخدم في وضع الانتظار، لكن سنسمح له بالدخول');
          // يمكننا أيضًا تحديث حالة المستخدم إلى approved بشكل تلقائي عند التسجيل
          try {
            await supabaseAdmin
              .from('users')
              .update({
                status: 'approved',
                updated_at: new Date().toISOString()
              })
              .eq('id', userData.id);
            
            // تحديث البيانات في ذاكرة التشغيل
            userData.status = 'approved';
            console.log('تم تحديث حالة المستخدم إلى approved');
          } catch (updateError) {
            console.error('خطأ في تحديث حالة المستخدم:', updateError);
            // حتى لو فشل التحديث، نستمر في تسجيل الدخول
          }
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
            // نتأكد من تعيين الحالة إلى approved للتأكد من الوصول
            status: 'approved', // تعيين للتأكد
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
        successResponse.cookies.set('status', encodeURIComponent(sessionData.user.status || 'approved'), { path: '/', maxAge, sameSite: 'lax' })
        successResponse.cookies.set('subscription_status', encodeURIComponent(sessionData.user.subscription_status || 'inactive'), { path: '/', maxAge, sameSite: 'lax' })
        return successResponse
      } else {
        // إذا لم يتم العثور على المستخدم أو هناك خطأ في الاستعلام
        // إنشاء مستخدم مؤقت للاختبار - هذا فقط للتجربة وينبغي تغييره في الإنتاج
        console.log('User not found or error, creating test user');
        // منع إنشاء حسابات تجريبية على جهاز محظور
        try {
          // توليد بصمة مشابهة لمسار verify-device
          const ua = req.headers.get('user-agent') || ''
          const al = req.headers.get('accept-language') || ''
          const ae = req.headers.get('accept-encoding') || ''
          const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
          const crypto = await import('crypto')
          const fp = crypto.createHash('sha256').update(`${ua}|${al}|${ae}|${ip}`).digest('hex')
          const { data: bannedByFp } = await supabaseAdmin
            .from('device_tracking')
            .select('id')
            .eq('device_fingerprint', fp)
            .eq('is_banned', true)
            .limit(1)
          if (bannedByFp && bannedByFp.length > 0) {
            return NextResponse.json(
              { error: 'هذا الجهاز محظور' },
              { status: 403 }
            )
          }
        } catch {}

        const testUser = {
          id: 'test-' + Date.now(),
          email: isPhone ? `${identifier.replace(/[^0-9]/g, '')}@test.com` : identifier,
          full_name: 'مستخدم تجريبي',
          phone_number: isPhone ? identifier : '',
          role: 'student',
          status: 'approved',
          subscription_status: 'inactive'
        };
        
        const sessionData = {
          user: testUser,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };
        
        const testResponse = NextResponse.json({
          success: true,
          user: testUser,
          session: sessionData,
          message: 'تم تسجيل الدخول بنجاح (وضع تجريبي)!'
        })
        const maxAge = 24 * 60 * 60
        testResponse.cookies.set('loggedIn', 'true', { path: '/', maxAge, sameSite: 'lax' })
        testResponse.cookies.set('role', 'student', { path: '/', maxAge, sameSite: 'lax' })
        testResponse.cookies.set('status', 'approved', { path: '/', maxAge, sameSite: 'lax' })
        testResponse.cookies.set('subscription_status', 'inactive', { path: '/', maxAge, sameSite: 'lax' })
        return testResponse
      }
    } catch (dbError) {
      console.error('Error accessing database:', dbError);
      
      // إذا فشل الوصول إلى قاعدة البيانات، نقوم بإنشاء مستخدم تجريبي
      const fallbackUser = {
        id: 'fallback-' + Date.now(),
        email: isPhone ? `${identifier.replace(/[^0-9]/g, '')}@fallback.com` : identifier,
        full_name: 'مستخدم تلقائي',
        phone_number: isPhone ? identifier : '',
        role: 'student',
        status: 'pending',
        subscription_status: 'inactive'
      };
      
      const sessionData = {
        user: fallbackUser,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      const fallbackResponse = NextResponse.json({
        success: true,
        user: fallbackUser,
        session: sessionData,
        message: 'تم إنشاء حساب مؤقت!'
      })
      const maxAge = 24 * 60 * 60
      fallbackResponse.cookies.set('loggedIn', 'true', { path: '/', maxAge, sameSite: 'lax' })
      fallbackResponse.cookies.set('role', 'student', { path: '/', maxAge, sameSite: 'lax' })
      fallbackResponse.cookies.set('status', 'pending', { path: '/', maxAge, sameSite: 'lax' })
      fallbackResponse.cookies.set('subscription_status', 'inactive', { path: '/', maxAge, sameSite: 'lax' })
      return fallbackResponse
    }
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    );
  }
}
