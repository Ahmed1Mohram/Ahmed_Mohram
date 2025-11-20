import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
import { createSubscriptionsTable, createPackagesTable } from './create-tables'

 

// الباقات الافتراضية
const DEFAULT_PACKAGES = [
  { id: '1', name: 'باقة الشهر الواحد', price: 200, daysCount: 30, isDefault: true, color: 'from-gold to-amber-600' },
  { id: '2', name: 'العرض المميز', price: 100, daysCount: 30, discountFrom: 200, isDefault: false, color: 'from-green-500 to-emerald-700' },
  { id: '3', name: 'باقة الشهرين', price: 400, daysCount: 60, isDefault: false, color: 'from-blue-500 to-indigo-700' },
  { id: '4', name: 'باقة 3 شهور', price: 500, daysCount: 90, isDefault: false, color: 'from-purple-500 to-purple-800' },
  { id: '5', name: 'باقة 5 شهور', price: 900, daysCount: 150, isDefault: false, color: 'from-red-500 to-rose-800' }
]

// إنشاء اشتراكات تجريبية لأغراض العرض
async function insertDemoSubscriptions() {
  try {
    // إنشاء مستخدم
    const adminId = 'admin-demo-' + Date.now();
    const { error: userError } = await supabaseAdmin
      .from('users')
      .upsert({
        id: adminId,
        email: 'demo@education.com',
        full_name: 'حساب تجريبي',
        phone_number: '01010101010',
        role: 'student',
        status: 'approved',
        subscription_status: 'active'
      });
    
    if (userError) {
      console.error('Error creating demo user:', userError);
      return false;
    }
    
    // إنشاء اشتراك فعال
    const now = new Date();
    const expiryDate = new Date();
    expiryDate.setDate(now.getDate() + 30);
    
    const { error: subError } = await supabaseAdmin
      .from('subscriptions')
      .upsert({
        user_id: adminId,
        package_id: '1',
        package_name: 'باقة الشهر الواحد',
        start_date: now.toISOString(),
        expiry_date: expiryDate.toISOString(),
        price: 200,
        days_count: 30,
        payment_method: 'vodafone_cash',
        status: 'active'
      });
    
    if (subError) {
      console.error('Error creating demo subscription:', subError);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error in insertDemoSubscriptions:', error);
    return false;
  }
}

// GET: جلب اشتراكات المستخدمين
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const status = searchParams.get('status')
    
    let query = supabaseAdmin
      .from('subscriptions')
      .select(`
        *,
        users:user_id (
          id,
          full_name,
          phone_number,
          email,
          status,
          payment_proof_url
        )
      `)
      .order('created_at', { ascending: false })
      
    if (userId) {
      query = query.eq('user_id', userId)
    }
    
    if (status) {
      query = query.eq('status', status)
    }
    
    const { data, error } = await query

    // في حالة عدم وجود الجدول
    if (error && error.code === 'PGRST205') {
      console.log('Subscriptions table does not exist, creating...');
      
      // إنشاء جداول البيانات
      const tablesCreated = await createSubscriptionsTable();
      const packagesCreated = await createPackagesTable();
      
      if (tablesCreated) {
        // إدخال بيانات تجريبية
        await insertDemoSubscriptions();
        
        return NextResponse.json({
          success: true,
          subscriptions: [],
          message: 'تم إنشاء جداول البيانات. الرجاء إعادة تحميل الصفحة للاطلاع على البيانات.'
        });
      }

      // لو فشل إنشاء الجداول، لا نكسر لوحة الأدمن؛ نرجع قائمة فارغة
      return NextResponse.json({
        success: true,
        subscriptions: [],
        error: 'فشل إنشاء جدول الاشتراكات'
      });
    }

    // في حالة أي خطأ آخر (مثل Invalid API key)، لا نرمي استثناء بل نرجع قائمة فارغة
    if (error) {
      console.warn('Subscriptions query error, returning empty list instead of 500:', error)
      return NextResponse.json({
        success: true,
        subscriptions: [],
        error: error.message
      })
    }
    
    // حساب الأيام المتبقية لكل اشتراك
    const now = new Date()
    const subscriptionsWithDays = data.map((subscription: any) => {
      const expiryDate = new Date(subscription.expiry_date)
      const daysLeft = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const isActive = daysLeft > 0 && subscription.status === 'active'
      
      // جمع رابط إيصال الدفع من جدول المستخدمين
      let receiptUrl = null;
      
      // محاولة الحصول على الرابط من جدول المستخدمين
      if (subscription.users && subscription.users.payment_proof_url) {
        receiptUrl = subscription.users.payment_proof_url;
      }
      
      return {
        ...subscription,
        days_left: Math.max(0, daysLeft),
        is_active: isActive,
        receipt_url: receiptUrl // إضافة رابط الإيصال للبيانات
      }
    })
    
    return NextResponse.json({
      success: true,
      subscriptions: subscriptionsWithDays
    })
  } catch (error: any) {
    console.error('Subscription API error:', error)
    // حتى في الأخطاء غير المتوقعة، نرجع قائمة فارغة للحفاظ على عمل لوحة الأدمن
    return NextResponse.json({
      success: true,
      subscriptions: [],
      error: error.message || 'حدث خطأ في جلب الاشتراكات'
    })
  }
}

// POST: إضافة أو تعديل اشتراك
export async function POST(req: NextRequest) {
  try {
    const { 
      id, user_id, package_id, package_name, 
      days_count, status = 'pending', 
      addDays = false, daysChange = 0,
      allowPlatformAccess = false // علامة للسماح بدخول المنصة
    } = await req.json()
    
    // التأكد من وجود الأعمدة الأساسية في جدول الاشتراكات لتجنب أخطاء مخطط Supabase
    try {
      await supabaseAdmin.rpc('exec', {
        sql: `
          ALTER TABLE public.subscriptions
            ADD COLUMN IF NOT EXISTS expiry_date TIMESTAMPTZ,
            ADD COLUMN IF NOT EXISTS days_count INTEGER,
            ADD COLUMN IF NOT EXISTS price INTEGER,
            ADD COLUMN IF NOT EXISTS payment_method TEXT,
            ADD COLUMN IF NOT EXISTS transaction_id TEXT,
            ADD COLUMN IF NOT EXISTS start_date TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
            ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        `
      })
    } catch (ensureError) {
      console.log('Non-critical: failed to ensure subscriptions columns', ensureError)
    }
    
    // إذا كان تعديل على اشتراك موجود
    if (id) {
      // جلب الاشتراك الحالي
      const { data: currentSub, error: fetchError } = await supabaseAdmin
        .from('subscriptions')
        .select('*')
        .eq('id', id)
        .single()
      
      if (fetchError || !currentSub) {
        return NextResponse.json(
          { error: 'الاشتراك غير موجود' },
          { status: 404 }
        )
      }
      
      // تحديث تاريخ الانتهاء إذا تم تغيير عدد الأيام
      let expiryDate = currentSub.expiry_date ? new Date(currentSub.expiry_date) : new Date()
      if (addDays && daysChange !== 0) {
        expiryDate.setDate(expiryDate.getDate() + daysChange)
      }
      
      // تعديل حالة الاشتراك وتاريخ الانتهاء
      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: status,
          expiry_date: expiryDate.toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
      
      if (updateError) {
        throw new Error(updateError.message)
      }
      
      // تحديث حالة اشتراك المستخدم والسماح بدخول المنصة ومشاهدة المحاضرات
      if (status === 'active') {
        const userUpdateData: any = {
          subscription_status: 'active',
          subscription_end_date: expiryDate.toISOString(),
          package_name: currentSub.package_name
        };
        
        // إذا كانت علامة السماح بدخول المنصة مفعلة
        if (allowPlatformAccess) {
          // إضافة حقل role للسماح بالوصول إلى المحتوى
          userUpdateData.role = 'student';
          // إضافة حقل status لتمكين المستخدم
          userUpdateData.status = 'approved';
        }
        
        await supabaseAdmin
          .from('users')
          .update(userUpdateData)
          .eq('id', currentSub.user_id)
      } else if (status === 'expired' || status === 'cancelled') {
        const userUpdateData: any = {
          subscription_status: status === 'expired' ? 'expired' : 'inactive'
        };

        if (status === 'expired') {
          userUpdateData.subscription_end_date = expiryDate.toISOString();
        }

        await supabaseAdmin
          .from('users')
          .update(userUpdateData)
          .eq('id', currentSub.user_id)
      }
      
      // تخصيص رسالة النجاح بناءً على العملية التي تمت
      let successMessage = '';
      if (status === 'active' && allowPlatformAccess) {
        successMessage = 'تم تفعيل الاشتراك والسماح للمستخدم بالدخول إلى المنصة ومشاهدة المحاضرات';
      } else {
        successMessage = `تم تحديث الاشتراك بنجاح${addDays ? ` وتعديل المدة بـ ${daysChange} يوم` : ''}`;
      }
      
      return NextResponse.json({
        success: true,
        subscription: updatedSub?.[0] || null,
        message: successMessage,
        allowPlatformAccess: allowPlatformAccess && status === 'active'
      })
    } 
    // إنشاء اشتراك جديد
    else if (user_id && package_id && days_count) {
      // التحقق من وجود المستخدم
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', user_id)
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
      expiryDate.setDate(now.getDate() + parseInt(days_count.toString()))
      
      // إنشاء اشتراك جديد
      const { data: newSub, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          user_id: user_id,
          package_id: package_id,
          package_name: package_name,
          start_date: now.toISOString(),
          expiry_date: expiryDate.toISOString(),
          days_count: days_count,
          status: status,
          created_at: now.toISOString()
        })
        .select()
      
      if (createError) {
        throw new Error(createError.message)
      }
      
      // تحديث حالة اشتراك المستخدم والسماح بدخول المنصة
      if (status === 'active') {
        const userUpdateData: any = {
          subscription_status: 'active',
          subscription_end_date: expiryDate.toISOString(),
          package_name: package_name
        };
        
        // إذا كانت علامة السماح بدخول المنصة مفعلة
        if (allowPlatformAccess) {
          // إضافة حقول لتمكين المستخدم من دخول المنصة ومشاهدة المحاضرات
          userUpdateData.role = 'student';
          userUpdateData.status = 'approved';
        }
        
        await supabaseAdmin
          .from('users')
          .update(userUpdateData)
          .eq('id', user_id)
      }
      
      return NextResponse.json({
        success: true,
        subscription: newSub?.[0] || null,
        message: 'تم إنشاء الاشتراك بنجاح'
      })
    } else {
      return NextResponse.json(
        { error: 'بيانات غير كافية لإنشاء الاشتراك' },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في معالجة الاشتراك' },
      { status: 500 }
    )
  }
}

// DELETE: حذف اشتراك
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams
  const subscriptionId = searchParams.get('id')

  if (!subscriptionId) {
    return NextResponse.json(
      { error: 'معرف الاشتراك مطلوب' },
      { status: 400 }
    )
  }

  try {
    // الحصول على معلومات الاشتراك قبل الحذف
    const { data: subscription, error: fetchError } = await supabaseAdmin
      .from('subscriptions')
      .select('user_id')
      .eq('id', subscriptionId)
      .single()
    
    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'الاشتراك غير موجود' },
        { status: 404 }
      )
    }
    
    // حذف الاشتراك
    const { error: deleteError } = await supabaseAdmin
      .from('subscriptions')
      .delete()
      .eq('id', subscriptionId)
    
    if (deleteError) {
      throw new Error(deleteError.message)
    }
    
    // تحديث حالة اشتراك المستخدم
    await supabaseAdmin
      .from('users')
      .update({ subscription_status: 'inactive' })
      .eq('id', subscription.user_id)
    
    return NextResponse.json({
      success: true,
      message: 'تم حذف الاشتراك بنجاح'
    })
  } catch (error: any) {
    console.error('Subscription API error:', error)
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حذف الاشتراك' },
      { status: 500 }
    )
  }
}
