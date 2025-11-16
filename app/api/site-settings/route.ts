import { NextResponse } from 'next/server'
// سنستخدم استيراداً ديناميكياً لتقليل البصمة أثناء التجميع

// الإعدادات الافتراضية
const defaultSettings = {
  hero_title: 'مرحباً بك في منصة أحمد محرم',
  hero_description: 'منصة تعليمية رائدة تضم أكثر من 50,000 طالب نقدم لك أفضل تجربة تعليمية بمعايير عالمية',
  total_students: '50,000',
  total_courses: '500+',
  success_rate: '98%',
  active_students: '50K+',
  total_teachers: '50+',
  happy_students: '10,000+',
  available_lessons: '500+',
  phone_number: '01005209667',
  whatsapp_number: '201005209667',
  facebook_url: 'https://www.facebook.com/ahmd.mhrm.456292',
  twitter_url: '#',
  instagram_url: 'https://www.instagram.com/ahmed_mohram6?igsh=cjRjMHNpZXR4aDJz',
  youtube_url: '#'
}

// دالة للتحقق من صحة تنسيق UUID
function isValidUUID(uuid: string) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

export async function GET() {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    // محاولة جلب الإعدادات من قاعدة البيانات باستخدام supabaseAdmin
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('settings')
      .limit(1)
      .single()

    if (error || !data) {
      // إذا لم توجد إعدادات، نرجع الإعدادات الافتراضية
      return NextResponse.json({
        success: true,
        settings: defaultSettings
      })
    }

    return NextResponse.json({
      success: true,
      settings: (data as any).settings || defaultSettings
    })
  } catch (error) {
    console.error('Error fetching settings:', error)
    // في حالة الخطأ، نرجع الإعدادات الافتراضية
    return NextResponse.json({
      success: true,
      settings: defaultSettings
    })
  }
}

export async function POST(request: Request) {
  try {
    const { supabaseAdmin } = await import('@/lib/db-client')
    const body = await request.json()
    const { settings } = body

    if (!settings) {
      return NextResponse.json(
        { error: 'الإعدادات مطلوبة' },
        { status: 400 }
      )
    }

    // التحقق من وجود سجل موجود
    const { data: existingData } = await supabaseAdmin
      .from('site_settings')
      .select('id')
      .limit(1)
      .single()

    if (existingData) {
      // تأكد من أن معرف UUID صحيح قبل استخدامه
      const id = existingData.id
      if (!id || typeof id !== 'string' || !isValidUUID(id)) {
        console.error('Invalid UUID format:', id)
        return NextResponse.json(
          { error: 'معرف UUID غير صالح' },
          { status: 400 }
        )
      }

      // تحديث السجل الموجود
      const { error } = await supabaseAdmin
        .from('site_settings')
        .update({
          settings,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) {
        console.error('Error updating settings:', error)
        return NextResponse.json(
          { error: 'فشل تحديث الإعدادات', details: error.message },
          { status: 500 }
        )
      }
    } else {
      // إنشاء سجل جديد
      const { error } = await supabaseAdmin
        .from('site_settings')
        .insert({
          settings,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (error) {
        console.error('Error creating settings:', error)
        return NextResponse.json(
          { error: 'فشل حفظ الإعدادات', details: error.message },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم حفظ الإعدادات بنجاح'
    })
  } catch (error) {
    console.error('Error saving settings:', error)
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حفظ الإعدادات' },
      { status: 500 }
    )
  }
}
