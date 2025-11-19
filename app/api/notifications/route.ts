import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

function getUserIdFromRequest(req: NextRequest): string | null {
  const userStr = req.headers.get('x-user-data') || req.cookies.get('user')?.value || ''
  const headerUserId = req.headers.get('x-user-id') || ''

  let userId: string | null = null
  if (userStr) {
    try {
      if (userStr.trim().startsWith('{')) {
        const userData = JSON.parse(userStr)
        userId = userData?.id || null
      } else {
        userId = userStr
      }
    } catch {
      // ignore parse error
    }
  }
  if (!userId && headerUserId) userId = headerUserId
  return userId
}

export async function GET(req: NextRequest) {
  try {
    const userId = getUserIdFromRequest(req)
    if (!userId) {
      return NextResponse.json({ success: false, error: 'unauthorized' }, { status: 401 })
    }

    const url = new URL(req.url)
    const markRead = url.searchParams.get('markRead') === '1'

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .select('id, user_id, type, title, message, is_read, created_at')
      .or(`user_id.eq.${userId},user_id.is.null`)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    const notifications = data || []
    const unreadCount = notifications.filter((n: any) => n.user_id === userId && n.is_read !== true).length

    if (markRead && unreadCount > 0) {
      try {
        await supabaseAdmin
          .from('notifications')
          .update({ is_read: true })
          .eq('user_id', userId)
          .eq('is_read', false)
      } catch {
        // لا نكسر الـ API لو فشل تحديث حالة القراءة
      }
    }

    return NextResponse.json({ success: true, notifications, unreadCount })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ success: false, error: 'FORBIDDEN' }, { status: 403 })
    }

    const body = await req.json()
    const { userId, type, title, message } = body || {}

    if (!type || !title || !message) {
      return NextResponse.json({ success: false, error: 'type, title and message are required' }, { status: 400 })
    }

    const payload: any = {
      user_id: userId || null,
      type,
      title,
      message,
      is_read: false,
    }

    const { data, error } = await supabaseAdmin
      .from('notifications')
      .insert(payload)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, notification: data })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'server error' }, { status: 500 })
  }
}
