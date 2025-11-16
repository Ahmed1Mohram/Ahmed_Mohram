import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

// Admin client with service role key
 

export async function POST(req: NextRequest) {
  try {
    const { email, password, fullName, phoneNumber } = await req.json()

    // Validate input
    if (!email || !password || !fullName || !phoneNumber) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      )
    }

    // Check if phone number already exists
    const { data: existingPhone } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle()

    if (existingPhone) {
      return NextResponse.json(
        { error: 'رقم الهاتف مسجل مسبقاً' },
        { status: 400 }
      )
    }

    // Create auth user with admin privileges
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        phone_number: phoneNumber
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      
      // If email already exists, try to get the existing user
      if (authError.message.includes('already registered')) {
        return NextResponse.json(
          { error: 'البريد الإلكتروني مسجل مسبقاً' },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: authError.message },
        { status: 400 }
      )
    }

    // Add user to database
    if (authData.user) {
      const { error: dbError } = await supabaseAdmin
        .from('users')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          full_name: fullName,
          phone_number: phoneNumber,
          status: 'pending',
          role: 'student'
        })

      if (dbError && !dbError.message.includes('duplicate')) {
        console.error('Database error:', dbError)
        // Don't fail if database insert fails, user is created in auth
      }

      return NextResponse.json({
        success: true,
        user: authData.user,
        message: 'تم إنشاء الحساب بنجاح'
      })
    }

    return NextResponse.json(
      { error: 'فشل إنشاء الحساب' },
      { status: 500 }
    )
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ غير متوقع' },
      { status: 500 }
    )
  }
}
