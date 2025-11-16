import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  return uuidRegex.test(uuid)
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
    const { userId, device_fingerprint } = await req.json()
    if (!userId && !device_fingerprint) return NextResponse.json({ error: 'userId أو device_fingerprint مطلوب' }, { status: 400 })
    if (userId && !isValidUUID(userId)) return NextResponse.json({ error: 'UUID غير صالح' }, { status: 400 })

    await ensureDeviceTracking()
    let error
    if (device_fingerprint) {
      ;({ error } = await supabaseAdmin
        .from('device_tracking')
        .update({ is_banned: true })
        .eq('device_fingerprint', device_fingerprint))
    } else if (userId) {
      ;({ error } = await supabaseAdmin
        .from('device_tracking')
        .update({ is_banned: true })
        .eq('user_id', userId))
    }

    if (error) return NextResponse.json({ error: (error as any).message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'server error' }, { status: 500 })
  }
}
