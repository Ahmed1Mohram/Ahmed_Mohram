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

// POST - تسجيل جهاز جديد أو التحقق من حظره
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { userId } = body
    
    if (!userId) {
      return NextResponse.json({ error: 'معرف المستخدم مطلوب' }, { status: 400 })
    }
    
    const deviceFingerprint = generateDeviceFingerprint(req)
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || null
    
    // التحقق من حظر الجهاز
    const { data: bannedDevice } = await supabaseAdmin
      .from('device_tracking')
      .select('*')
      .eq('device_fingerprint', deviceFingerprint)
      .eq('is_banned', true)
      .single()
    
    if (bannedDevice) {
      return NextResponse.json({
        success: false,
        banned: true,
        message: 'هذا الجهاز محظور',
        reason: bannedDevice.banned_reason
      }, { status: 403 })
    }
    
    // التحقق من حظر المستخدم
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('status, banned_devices')
      .eq('id', userId)
      .single()
    
    if (user?.status === 'banned') {
      return NextResponse.json({
        success: false,
        banned: true,
        message: 'حسابك محظور'
      }, { status: 403 })
    }
    
    if (user?.banned_devices?.includes(deviceFingerprint)) {
      return NextResponse.json({
        success: false,
        banned: true,
        message: 'هذا الجهاز محظور لهذا الحساب'
      }, { status: 403 })
    }
    
    // تسجيل أو تحديث معلومات الجهاز
    const deviceInfo = {
      userAgent: req.headers.get('user-agent'),
      platform: req.headers.get('sec-ch-ua-platform'),
      mobile: req.headers.get('sec-ch-ua-mobile'),
      screenResolution: body.screenResolution,
      timezone: body.timezone
    }
    
    // جلب جميع أجهزة المستخدم
    const { data: userDevices } = await supabaseAdmin
      .from('device_tracking')
      .select('*')
      .eq('user_id', userId)
    
    // التحقق من إذا كان الجهاز الحالي مسجلاً بالفعل
    const existingDevice = userDevices?.find(device => 
      device.device_fingerprint === deviceFingerprint
    )
    
    // إذا كان الجهاز موجوداً، قم بتحديثه
    if (existingDevice) {
      // تحديث آخر نشاط
      await supabaseAdmin
        .from('device_tracking')
        .update({
          last_active: new Date().toISOString(),
          ip_address: ip,
          device_info: deviceInfo
        })
        .eq('id', existingDevice.id)
      
      return NextResponse.json({
        success: true,
        deviceFingerprint,
        message: 'تم تحديث الجهاز بنجاح'
      })
    } 
    
    // إذا كان لدى المستخدم جهاز مسجل بالفعل ولكنه جهاز مختلف
    if (userDevices && userDevices.length > 0) {
      // رفض الجهاز الجديد
      return NextResponse.json({
        success: false,
        allowed: false,
        message: 'غير مسموح بتسجيل الدخول من هذا الجهاز. يمكنك استخدام حسابك فقط على جهازك الأصلي.'
      }, { status: 403 })
    } else {
      // إذا لم يكن لدى المستخدم أي جهاز مسجل، قم بتسجيل هذا الجهاز
      await supabaseAdmin
        .from('device_tracking')
        .insert({
          user_id: userId,
          device_fingerprint: deviceFingerprint,
          device_info: deviceInfo,
          ip_address: ip,
          is_banned: false,
          last_active: new Date().toISOString()
        })
      
      return NextResponse.json({
        success: true,
        deviceFingerprint,
        message: 'تم تسجيل الجهاز الأول بنجاح'
      })
    }
    
  } catch (error: any) {
    console.error('Device tracking error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// GET - جلب قائمة الأجهزة للأدمن
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    
    let query = supabaseAdmin
      .from('device_tracking')
      .select(`
        *,
        users(full_name, email, phone_number)
      `)
    
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    const { data: devices, error } = await query.order('last_active', { ascending: false })
    
    if (error) {
      console.error('Error fetching devices:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({
      success: true,
      devices
    })
    
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PUT - حظر أو إلغاء حظر جهاز
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const { deviceId, action, reason } = body
    
    if (!deviceId || !action) {
      return NextResponse.json({ 
        error: 'معرف الجهاز والإجراء مطلوبان' 
      }, { status: 400 })
    }
    
    const updateData: any = {
      is_banned: action === 'ban',
      banned_reason: action === 'ban' ? reason : null,
      banned_at: action === 'ban' ? new Date().toISOString() : null
    }
    
    const { data: device, error } = await supabaseAdmin
      .from('device_tracking')
      .update(updateData)
      .eq('id', deviceId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating device:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // إضافة بصمة الجهاز لقائمة الأجهزة المحظورة للمستخدم
    if (action === 'ban' && device) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('banned_devices')
        .eq('id', device.user_id)
        .single()
      
      const bannedDevices = user?.banned_devices || []
      if (!bannedDevices.includes(device.device_fingerprint)) {
        bannedDevices.push(device.device_fingerprint)
        
        await supabaseAdmin
          .from('users')
          .update({ banned_devices: bannedDevices })
          .eq('id', device.user_id)
      }
    }
    
    return NextResponse.json({
      success: true,
      message: action === 'ban' ? 'تم حظر الجهاز' : 'تم إلغاء الحظر',
      device
    })
    
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
