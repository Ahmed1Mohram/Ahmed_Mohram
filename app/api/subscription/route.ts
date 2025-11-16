import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'



// واجهة البيانات للباقة
interface Package {
  id: string;
  name: string;
  price: number;
  daysCount: number;
  discountFrom?: number;
  isDefault?: boolean;
  color?: string;
}

// باقات الاشتراك الافتراضية
export const DEFAULT_PACKAGES: Package[] = [
  { id: '1', name: 'باقة الشهر الواحد', price: 200, daysCount: 30, isDefault: true, color: 'from-gold to-amber-600' },
  { id: '2', name: 'العرض المميز', price: 100, daysCount: 30, discountFrom: 200, isDefault: false, color: 'from-green-500 to-emerald-700' },
  { id: '3', name: 'باقة الشهرين', price: 400, daysCount: 60, isDefault: false, color: 'from-blue-500 to-indigo-700' },
  { id: '4', name: 'باقة 3 شهور', price: 500, daysCount: 90, isDefault: false, color: 'from-purple-500 to-purple-800' },
  { id: '5', name: 'باقة 5 شهور', price: 900, daysCount: 150, isDefault: false, color: 'from-red-500 to-rose-800' }
]

// POST لإنشاء أو تحديث اشتراك
export async function POST(req: NextRequest) {
  try {
    const { userId, packageId, paymentMethod, transactionId } = await req.json()

    if (!userId || !packageId) {
      return NextResponse.json(
        { error: 'جميع البيانات مطلوبة' },
        { status: 400 }
      )
    }

    // جلب معلومات الباقة
    const selectedPackage = DEFAULT_PACKAGES.find(pkg => pkg.id === packageId)
    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'الباقة غير موجودة' },
        { status: 400 }
      )
    }

    // التحقق من وجود المستخدم
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'المستخدم غير موجود' },
        { status: 400 }
      )
    }

    // حساب تاريخ انتهاء الاشتراك
    const now = new Date()
    const expiryDate = new Date()
    expiryDate.setDate(now.getDate() + selectedPackage.daysCount)

    // إنشاء أو تحديث الاشتراك
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: userId,
        package_id: packageId,
        package_name: selectedPackage.name,
        start_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        price: selectedPackage.price,
        days_count: selectedPackage.daysCount,
        payment_method: paymentMethod,
        transaction_id: transactionId,
        status: 'pending' // بانتظار الموافقة من الإدارة
      })
      .select()

    if (subscriptionError) {
      return NextResponse.json(
        { error: 'فشل إنشاء الاشتراك' },
        { status: 500 }
      )
    }

    // إنشاء إشعار للإدارة
    await supabaseAdmin
      .from('notifications')
      .insert({
        user_id: userId,
        type: 'subscription',
        title: 'طلب اشتراك جديد',
        message: `طلب اشتراك جديد من ${userData.full_name} - ${userData.phone_number} - الباقة: ${selectedPackage.name}`
      })

    return NextResponse.json({
      success: true,
      subscription: subscriptionData,
      message: 'تم إنشاء طلب الاشتراك بنجاح. في انتظار موافقة الإدارة'
    })

  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في إنشاء الاشتراك' },
      { status: 500 }
    )
  }
}

// GET لجلب معلومات الاشتراكات
export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const userId = searchParams.get('userId')
  const getPackages = searchParams.get('packages')

  try {
    // إذا طلب قائمة الباقات فقط
    if (getPackages === 'true') {
      try {
        // جلب الباقات من قاعدة البيانات إن وجدت
        const { data: packagesData, error: packagesError } = await supabaseAdmin
          .from('packages')
          .select('*')
          .order('price', { ascending: true })
        
        // إذا لم يكن جدول الباقات موجودًا أو فارغًا
        if (packagesError && packagesError.code === 'PGRST205') {
          // محاولة إنشاء جدول الباقات
          await supabaseAdmin.rpc('exec', {
            sql: `
              CREATE TABLE IF NOT EXISTS packages (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                price INTEGER NOT NULL,
                days_count INTEGER NOT NULL,
                discount_from INTEGER,
                color TEXT,
                is_default BOOLEAN DEFAULT false,
                created_at TIMESTAMPTZ DEFAULT NOW(),
                updated_at TIMESTAMPTZ DEFAULT NOW()
              );
            `
          });
          
          // إدخال الباقات الافتراضية
          await supabaseAdmin
            .from('packages')
            .upsert(DEFAULT_PACKAGES.map(pkg => ({
              id: pkg.id,
              name: pkg.name,
              price: pkg.price,
              days_count: pkg.daysCount,
              discount_from: pkg.discountFrom || null,
              color: pkg.color || 'from-gold to-amber-600',
              is_default: pkg.isDefault || false
            })))
          
          // إرجاع الباقات الافتراضية
          return NextResponse.json({
            success: true,
            packages: DEFAULT_PACKAGES,
            info: 'تم إنشاء جدول الباقات وإضافة الباقات الافتراضية'
          })
        }
        
        // إذا وجد أي خطأ آخر أو الجدول فارغ
        if (packagesError || !packagesData || packagesData.length === 0) {
          return NextResponse.json({
            success: true,
            packages: DEFAULT_PACKAGES,
            info: 'تم استخدام الباقات الافتراضية'
          })
        }
        
        // إرجاع الباقات من قاعدة البيانات
        return NextResponse.json({
          success: true,
          packages: packagesData
        })
      } catch (error) {
        console.error('Error handling packages:', error)
        // في حالة حدوث أي استثناء، إرجاع الباقات الافتراضية
        return NextResponse.json({
          success: true,
          packages: DEFAULT_PACKAGES,
          error: 'تم استخدام الباقات الافتراضية بسبب خطأ في قاعدة البيانات'
        })
      }
    }

    // التحقق من وجود userId
    if (!userId) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      )
    }

    // جلب معلومات اشتراك المستخدم
    const { data: subscriptionData, error: subscriptionError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (subscriptionError) {
      return NextResponse.json(
        { error: 'فشل جلب معلومات الاشتراك' },
        { status: 500 }
      )
    }

    // التحقق من حالة الاشتراك وتاريخ انتهائه
    if (subscriptionData) {
      const expiryDate = new Date(subscriptionData.expiry_date)
      const now = new Date()
      const isActive = expiryDate > now && subscriptionData.status === 'active'
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      // تحديث حالة المستخدم إذا كان الاشتراك نشطًا
      if (isActive) {
        await supabaseAdmin
          .from('users')
          .update({ subscription_status: 'active' })
          .eq('id', userId)
      } else if (daysLeft <= 0 && subscriptionData.status === 'active') {
        // إذا انتهى الاشتراك، تحديث حالته
        await supabaseAdmin
          .from('subscriptions')
          .update({ status: 'expired' })
          .eq('id', subscriptionData.id)

        await supabaseAdmin
          .from('users')
          .update({ subscription_status: 'inactive' })
          .eq('id', userId)

        subscriptionData.status = 'expired'
      }

      return NextResponse.json({
        success: true,
        subscription: {
          ...subscriptionData,
          is_active: isActive,
          days_left: Math.max(0, daysLeft)
        }
      })
    }

    return NextResponse.json({
      success: true,
      subscription: null,
      message: 'لا يوجد اشتراك نشط'
    })

  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في جلب معلومات الاشتراك' },
      { status: 500 }
    )
  }
}
