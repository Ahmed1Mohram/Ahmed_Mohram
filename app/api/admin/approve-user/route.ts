import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// دالة للتحقق من صحة تنسيق UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// طباعة مفاتيح API للتأكد من قراءتها بشكل صحيح (لأغراض التصحيح فقط)
console.log('SUPABASE URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
// طباعة أول 10 أحرف من المفتاح فقط للأمان
console.log('SERVICE_ROLE_KEY (first 10 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 10));

export async function POST(req: NextRequest) {
  try {
    const { userId, action } = await req.json()

    console.log('Approve user request:', { userId, action })

    if (!userId || !action) {
      return NextResponse.json(
        { error: 'معرف المستخدم والإجراء مطلوبان' },
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

    let updateData: any = {}

    if (action === 'approve') {
      updateData = {
        status: 'approved',
        subscription_status: 'active',
        subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        updated_at: new Date().toISOString()
      }
    } else if (action === 'reject') {
      updateData = {
        status: 'rejected',
        subscription_status: 'inactive',
        updated_at: new Date().toISOString()
      }
    } else {
      return NextResponse.json(
        { error: 'إجراء غير صالح' },
        { status: 400 }
      )
    }

    console.log('Update data:', updateData)
    console.log('URL being used:', 'https://fsvwusrpuiczznzgnyvd.supabase.co')

    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update error:', error)
      console.error('Complete error object:', JSON.stringify(error))
      return NextResponse.json(
        { error: 'فشل تحديث حالة المستخدم', details: error.message },
        { status: 500 }
      )
    }

    // Send notification to user (if approved)
    if (action === 'approve') {
      try {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'approval',
            title: 'تم قبول اشتراكك!',
            message: 'مبروك! تم قبول اشتراكك في المنصة. يمكنك الآن الوصول لجميع المحتويات.',
            is_read: false,
            created_at: new Date().toISOString()
          })
      } catch (notifError) {
        console.log('Notification error (non-critical):', notifError)
      }
    }

    return NextResponse.json({
      success: true,
      message: action === 'approve' ? 'تم قبول المستخدم بنجاح' : 'تم رفض المستخدم',
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
