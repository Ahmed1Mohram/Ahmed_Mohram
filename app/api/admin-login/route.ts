import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
import crypto from 'crypto'

 

// مكون مبسط لتسجيل دخول الأدمن بدون قاعدة بيانات
export async function POST(req: NextRequest) {
  try {
    const { phoneNumber, password } = await req.json()

    // التحقق من الأدمن المباشر
    if (phoneNumber === 'أحمد محرم' && password === 'أحمد محرم') {
      // البحث عن حساب الأدمن أو إنشاؤه
      const { data: adminUser, error: fetchError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('role', 'admin')
        .single()

      if (fetchError || !adminUser) {
        // إنشاء حساب أدمن جديد
        const adminId = crypto.randomUUID()
        const { data: newAdmin, error: createError } = await supabaseAdmin
          .from('users')
          .insert({
            id: adminId,
            email: 'admin@education.com',
            full_name: 'أحمد محرم',
            phone_number: '01005209667',
            role: 'admin',
            status: 'approved',
            subscription_status: 'active'
          })
          .select()
          .single()

        if (createError) {
          console.error('Error creating admin:', createError)
          return NextResponse.json(
            { error: 'فشل إنشاء حساب الأدمن', details: createError.message },
            { status: 500 }
          )
        }

        return NextResponse.json({
          success: true,
          user: newAdmin,
          message: 'تم إنشاء حساب الأدمن بنجاح'
        })
      }

      return NextResponse.json({
        success: true,
        user: adminUser,
        message: 'مرحباً بالأدمن'
      })
    }

    // في حالة البيانات غير صحيحة
    return NextResponse.json(
      { error: 'بيانات دخول خاطئة' },
      { status: 401 }
    )
  } catch (error: any) {
    console.error('Admin login error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في تسجيل الدخول' },
      { status: 500 }
    )
  }
}
