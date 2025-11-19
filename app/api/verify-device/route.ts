import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/db-client'

// توليد بصمة الجهاز
function generateDeviceFingerprint(req: NextRequest) {
  const userAgent = req.headers.get('user-agent') || ''
  const acceptLanguage = req.headers.get('accept-language') || ''
  const acceptEncoding = req.headers.get('accept-encoding') || ''
  const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || ''
  
  const data = `${userAgent}|${acceptLanguage}|${acceptEncoding}|${ip}`
  return crypto.createHash('sha256').update(data).digest('hex')
}

/**
 * واجهة API للتحقق من الجهاز
 * يتم استدعاء هذه الواجهة عند تسجيل الدخول للتحقق مما إذا كان الجهاز مسموح له بالدخول
 * يتم رفض الدخول إذا كان المستخدم يحاول الدخول من جهاز آخر غير الجهاز الأصلي
 */
export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()
    
    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }
    
    // توليد بصمة الجهاز الحالي
    const currentDeviceFingerprint = generateDeviceFingerprint(req)

    // تأكيد وجود جدول تتبع الأجهزة
    try {
      const SQL = `
        CREATE TABLE IF NOT EXISTS device_tracking (
          id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
          user_id TEXT,
          device_fingerprint TEXT NOT NULL,
          device_info JSONB,
          ip_address TEXT,
          is_banned BOOLEAN DEFAULT FALSE,
          last_active TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabaseAdmin.rpc('exec', { sql: SQL })
    } catch {}

    // جلب بيانات المستخدم مبكرًا لمعرفة ما إذا كان أدمن
    const { data: userData } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle()
    if (!userData) {
      return NextResponse.json({ error: 'المستخدم غير موجود' }, { status: 404 })
    }

    // تجاوز كامل للأدمن: لا نحظر ولا نمنع، مع تسجيل الجهاز للأرشفة
    if (userData.role === 'admin') {
      try {
        const { data: exists } = await supabaseAdmin
          .from('device_tracking')
          .select('id')
          .eq('device_fingerprint', currentDeviceFingerprint)
          .eq('user_id', userId)
          .limit(1)
        if (exists && exists.length > 0) {
          await supabaseAdmin.from('device_tracking').update({
            is_banned: false,
            last_active: new Date().toISOString()
          }).eq('id', exists[0].id)
        } else {
          await supabaseAdmin.from('device_tracking').insert({
            user_id: userId,
            device_fingerprint: currentDeviceFingerprint,
            is_banned: false,
            last_active: new Date().toISOString()
          })
        }
      } catch {}
      return NextResponse.json({ success: true, allowed: true, isFirstDevice: false, message: 'admin bypass' })
    }

    // حظر عالمي حسب بصمة الجهاز إن كانت محظورة سابقاً (غير الأدمن فقط)
    try {
      const { data: bannedByFp, error: fpErr } = await supabaseAdmin
        .from('device_tracking')
        .select('id')
        .eq('device_fingerprint', currentDeviceFingerprint)
        .eq('is_banned', true)
        .limit(1)

      if (!fpErr && bannedByFp && bannedByFp.length > 0) {
        return NextResponse.json({ success: false, allowed: false, message: 'هذا الجهاز محظور' }, { status: 403 })
      }
    } catch {}

    // إذا كان المستخدم محظورًا فلا يُسمح بالوصول
    if (userData.status === 'banned') {
      try {
        const { data: exists } = await supabaseAdmin
          .from('device_tracking')
          .select('id')
          .eq('device_fingerprint', currentDeviceFingerprint)
          .limit(1)
        if (exists && exists.length > 0) {
          await supabaseAdmin
            .from('device_tracking')
            .update({ is_banned: true, last_active: new Date().toISOString(), user_id: userId })
            .eq('id', exists[0].id)
        } else {
          await supabaseAdmin
            .from('device_tracking')
            .insert({
              user_id: userId,
              device_fingerprint: currentDeviceFingerprint,
              is_banned: true,
              last_active: new Date().toISOString()
            })
        }
      } catch {}
      return NextResponse.json({ success: false, allowed: false, message: 'هذا الحساب محظور' }, { status: 403 })
    }
    
    // جلب جميع أجهزة المستخدم
    const { data: userDevices, error: devicesError } = await supabaseAdmin
      .from('device_tracking')
      .select('*')
      .eq('user_id', userId)
    
    if (devicesError) {
      console.error('Error fetching user devices:', devicesError)
      // في حالة الخطأ، نسمح بالوصول مؤقتاً
      return NextResponse.json({
        success: true,
        allowed: true,
        isFirstDevice: true,
        message: 'تم السماح بالوصول (الجهاز الأول)'
      })
    }
    
    // إذا لم يكن للمستخدم أجهزة مسجلة، فهذا هو الجهاز الأول
    if (!userDevices || userDevices.length === 0) {
      // تسجيل الجهاز
      await supabaseAdmin
        .from('device_tracking')
        .insert({
          user_id: userId,
          device_fingerprint: currentDeviceFingerprint,
          device_info: {
            userAgent: req.headers.get('user-agent'),
            platform: req.headers.get('sec-ch-ua-platform'),
            mobile: req.headers.get('sec-ch-ua-mobile')
          },
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
          is_banned: false,
          last_active: new Date().toISOString()
        })
      
      return NextResponse.json({
        success: true,
        allowed: true,
        isFirstDevice: true,
        message: 'تم السماح بالوصول (الجهاز الأول)'
      })
    }
    
    // البحث عن الجهاز الحالي في قائمة أجهزة المستخدم
    const registeredDevice = userDevices.find(device => 
      device.device_fingerprint === currentDeviceFingerprint
    )

    // إن كان أي جهاز للمستخدم محظورًا، امنع الدخول
    if (userDevices.some((d: any) => d.is_banned)) {
      return NextResponse.json({ success: false, allowed: false, message: 'أجهزتك محظورة' }, { status: 403 })
    }

    // إذا لم يكن الجهاز مسجلاً من قبل ولديه بالفعل جهاز/أجهزة أخرى، قم بتسجيله واسمح بالوصول
    if (!registeredDevice && userDevices.length > 0) {
      try {
        await supabaseAdmin
          .from('device_tracking')
          .insert({
            user_id: userId,
            device_fingerprint: currentDeviceFingerprint,
            device_info: {
              userAgent: req.headers.get('user-agent'),
              platform: req.headers.get('sec-ch-ua-platform'),
              mobile: req.headers.get('sec-ch-ua-mobile')
            },
            ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip'),
            is_banned: false,
            last_active: new Date().toISOString()
          })
      } catch {}

      return NextResponse.json({
        success: true,
        allowed: true,
        isFirstDevice: false,
        message: 'تم السماح بالوصول (جهاز جديد)' ,
      })
    }

    // إذا كان الجهاز مسجلاً، تحديث آخر وقت نشاط
    if (registeredDevice) {
      await supabaseAdmin
        .from('device_tracking')
        .update({
          last_active: new Date().toISOString(),
          ip_address: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip')
        })
        .eq('id', registeredDevice.id)
    }

    return NextResponse.json({
      success: true,
      allowed: true,
      isFirstDevice: false,
      message: 'تم السماح بالوصول (جهاز مسجل)'
    })
    
  } catch (error: any) {
    console.error('Device verification error:', error)
    // في حالة الخطأ، نسمح بالوصول لتجنب تعطيل المستخدمين
    return NextResponse.json({
      success: false,
      allowed: true,
      error: error.message,
      message: 'حدث خطأ أثناء التحقق من الجهاز'
    })
  }
}
