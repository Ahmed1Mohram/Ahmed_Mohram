import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// Admin client
 

export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, action } = await req.json()

    if (!phoneNumber) {
      return NextResponse.json(
        { error: 'رقم الهاتف مطلوب' },
        { status: 400 }
      )
    }

    if (action === 'delete') {
      // حذف المستخدم من قاعدة البيانات
      const { error } = await supabaseAdmin
        .from('users')
        .delete()
        .eq('phone_number', phoneNumber)
        .neq('role', 'admin') // لا تحذف الأدمن

      if (error) {
        console.error('Delete error:', error)
        return NextResponse.json(
          { error: 'فشل حذف المستخدم' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'تم حذف المستخدم بنجاح'
      })
    }

    if (action === 'reset_password') {
      // إعادة تعيين كلمة المرور (حذف الهاش القديم)
      const { error } = await supabaseAdmin
        .from('users')
        .update({ password_hash: null })
        .eq('phone_number', phoneNumber)

      if (error) {
        console.error('Reset error:', error)
        return NextResponse.json(
          { error: 'فشل إعادة تعيين كلمة المرور' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'تم إعادة تعيين كلمة المرور - يمكنك الآن تسجيل الدخول بأي كلمة مرور'
      })
    }

    return NextResponse.json(
      { error: 'إجراء غير صالح' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}

// GET endpoint لعرض جميع المستخدمين
export async function GET(req: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, phone_number, role, status')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch error:', error)
      return NextResponse.json(
        { error: 'فشل جلب المستخدمين' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      users: data,
      count: data?.length || 0
    })

  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
