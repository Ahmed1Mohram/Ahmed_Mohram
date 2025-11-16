import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// دالة للتحقق من صحة تنسيق UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// ensure device_tracking table exists
async function ensureDeviceTracking() {
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
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }
    
    // التحقق من صحة تنسيق UUID
    if (!isValidUUID(userId)) {
      console.error('Invalid UUID format:', userId)
      return NextResponse.json(
        { error: 'معرف UUID غير صالح' },
        { status: 400 }
      )
    }

    await ensureDeviceTracking()

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        status: 'banned',
        subscription_status: 'inactive' 
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Ban error:', error)
      return NextResponse.json(
        { error: 'فشل حظر المستخدم', details: error.message },
        { status: 500 }
      )
    }

    // Mark all device_tracking rows as is_banned = true
    const { error: deviceTrackingError } = await supabaseAdmin
      .from('device_tracking')
      .update({ is_banned: true })
      .eq('user_id', userId)

    if (deviceTrackingError) {
      console.error('Device tracking update error:', deviceTrackingError)
      return NextResponse.json(
        { error: 'فشل تحديث حالة جهاز المستخدم', details: deviceTrackingError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم حظر المستخدم بنجاح',
      user: data
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
