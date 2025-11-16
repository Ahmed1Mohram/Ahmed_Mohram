import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

 

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phoneNumber } = await req.json()

    console.log('Registration request:', { email, fullName, phoneNumber })

    // Validate input
    if (!email || !password || !fullName || !phoneNumber) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // Check if phone number already exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'رقم الهاتف مسجل مسبقاً' },
        { status: 400 }
      )
    }

    // Create a unique email if needed
    let finalEmail = email
    if (email === 'ahmed@gmail.com' || email.length < 10) {
      const randomNum = Math.floor(Math.random() * 100000)
      finalEmail = `user${randomNum}@education.com`
    }

    // Create auth user first
    let authData: any = null;
    const { data, error: authError } = await supabaseAdmin.auth.signUp({
      email: finalEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          phone_number: phoneNumber,
          original_email: email
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      // Try admin create if regular signup fails
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مسجل مسبقاً' },
          { status: 400 }
        )
      }
      
      // Use admin API to create user
      const { data: adminAuthData, error: adminError } = await supabaseAdmin.auth.admin.createUser({
        email: finalEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone_number: phoneNumber,
          original_email: email
        }
      })

      if (adminError) {
        console.error('Admin create error:', adminError)
        return NextResponse.json(
          { error: 'فشل إنشاء الحساب' },
          { status: 400 }
        )
      }

      // Use admin created user data
      authData = adminAuthData
    } else {
      authData = data
    }

    // Ensure password_plain column exists
    try {
      const SQL_ALTER = `ALTER TABLE IF EXISTS users ADD COLUMN IF NOT EXISTS password_plain TEXT;`
      await supabaseAdmin.rpc('exec', { sql: SQL_ALTER })
    } catch {}

    // Add user to database with all details
    if (authData?.user) {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: finalEmail,
          full_name: fullName,
          phone_number: phoneNumber,
          password_plain: password,
          status: 'pending', // في انتظار موافقة الأدمن
          role: 'student',
          subscription_status: 'inactive',
          created_at: new Date().toISOString()
        })

      if (dbError) {
        console.error('Database insert error:', dbError)
        
        // Try to update if user exists
        if (dbError.code === '23505' || dbError.message.includes('duplicate')) {
          const { error: updateError } = await supabaseAdmin
            .from('users')
            .update({
              full_name: fullName,
              phone_number: phoneNumber,
              email: finalEmail,
              status: 'pending',
              password_plain: password
            })
            .eq('id', authData.user.id)

          if (updateError) {
            console.error('Update error:', updateError)
          } else {
            console.log('User updated successfully')
          }
        }
      } else {
        console.log('User added to database successfully')
      }

      // Create notification for admin
      await supabaseAdmin
        .from('notifications')
        .insert({
          user_id: authData.user.id,
          type: 'registration',
          title: 'تسجيل مستخدم جديد',
          message: `مستخدم جديد: ${fullName} - ${phoneNumber}`
        })

      return NextResponse.json({
        success: true,
        user: {
          id: authData.user.id,
          email: finalEmail,
          full_name: fullName,
          phone_number: phoneNumber
        },
        message: 'تم إنشاء الحساب بنجاح. في انتظار موافقة الإدارة'
      })
    }

    return NextResponse.json(
      { error: 'فشل إنشاء الحساب' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('Registration API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في إنشاء الحساب' },
      { status: 500 }
    )
  }
}
