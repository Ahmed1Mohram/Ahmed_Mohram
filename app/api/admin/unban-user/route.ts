import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// دالة للتحقق من صحة تنسيق UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

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

    if (!isValidUUID(userId)) {
      return NextResponse.json(
        { error: 'معرف UUID غير صالح' },
        { status: 400 }
      )
    }

    await ensureDeviceTracking()

    // إعادة الحالة إلى approved (يمكن تعديلها لاحقاً حسب الحاجة)
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'فشل إلغاء الحظر', details: error.message },
        { status: 500 }
      )
    }

    // إزالة حظر الأجهزة المسجلة للمستخدم
    const { error: deviceErr } = await supabaseAdmin
      .from('device_tracking')
      .update({ is_banned: false })
      .eq('user_id', userId)

    if (deviceErr) {
      return NextResponse.json(
        { error: 'تم فك الحظر عن الحساب لكن حدث خطأ في تحديث الأجهزة', details: deviceErr.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: 'تم إلغاء الحظر بنجاح', user: data })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
