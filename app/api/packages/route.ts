import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
import { ensurePackagesTableExists, insertDefaultPackagesIfNeeded } from '@/lib/packages-util'

// الباقات الافتراضية التي ستظهر في حالة الخطأ
const DEFAULT_PACKAGES = [
  { id: '1', name: 'باقة الشهر الواحد', price: 200, days_count: 30, is_default: true, color: 'from-gold to-amber-600' },
  { id: '2', name: 'العرض المميز', price: 100, days_count: 30, discount_from: 200, is_default: false, color: 'from-green-500 to-emerald-700' },
  { id: '3', name: 'باقة الشهرين', price: 400, days_count: 60, is_default: false, color: 'from-blue-500 to-indigo-700' },
  { id: '4', name: 'باقة 3 شهور', price: 500, days_count: 90, is_default: false, color: 'from-purple-500 to-purple-800' },
  { id: '5', name: 'باقة 5 شهور', price: 900, days_count: 150, is_default: false, color: 'from-red-500 to-rose-800' }
];

// جلب الباقات المتاحة للمستخدمين
export async function GET(req: NextRequest) {
  try {
    console.log('Fetching packages for users...');
    
    // التأكد من وجود جدول الباقات وإنشائه إذا لم يكن موجوداً
    const tableExists = await ensurePackagesTableExists();
    
    // إذا لم يمكن إنشاء الجدول، استخدم الباقات الافتراضية
    if (!tableExists) {
      console.log('Could not ensure packages table exists, using default packages');
      
      // إرجاع الباقات الافتراضية مع تنسيقها لتتوافق مع واجهة المستخدم
      const formattedPackages = DEFAULT_PACKAGES.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        daysCount: pkg.days_count,
        days_count: pkg.days_count,
        discountFrom: pkg.discount_from,
        discount_from: pkg.discount_from,
        isDefault: pkg.is_default,
        is_default: pkg.is_default,
        color: pkg.color
      }));
      
      return NextResponse.json({
        success: true,
        packages: formattedPackages,
        info: 'تم استخدام الباقات الافتراضية لعدم وجود جدول الباقات'
      });
    }
    
    // إدخال الباقات الافتراضية إذا لم تكن موجودة بالفعل
    await insertDefaultPackagesIfNeeded();
    
    // محاولة جلب الباقات من قاعدة البيانات باستخدام supabaseAdmin
    console.log('Fetching packages from database using admin client...');
    const { data, error } = await supabaseAdmin
      .from('packages')
      .select('*')
      .order('price', { ascending: true });
    
    if (error) {
      console.error('Error fetching packages:', error);
      
      // إرجاع الباقات الافتراضية في حالة الخطأ
      const formattedPackages = DEFAULT_PACKAGES.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        daysCount: pkg.days_count,
        days_count: pkg.days_count,
        discountFrom: pkg.discount_from,
        discount_from: pkg.discount_from,
        isDefault: pkg.is_default,
        is_default: pkg.is_default,
        color: pkg.color
      }));
      
      return NextResponse.json({
        success: true,
        packages: formattedPackages,
        info: 'تم استخدام الباقات الافتراضية بسبب خطأ في قاعدة البيانات'
      });
    }
    
    // إذا لم تكن هناك باقات في قاعدة البيانات
    if (!data || data.length === 0) {
      console.log('No packages found in database, using defaults');
      
      const formattedPackages = DEFAULT_PACKAGES.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        daysCount: pkg.days_count,
        days_count: pkg.days_count,
        discountFrom: pkg.discount_from,
        discount_from: pkg.discount_from,
        isDefault: pkg.is_default,
        is_default: pkg.is_default,
        color: pkg.color
      }));
      
      return NextResponse.json({
        success: true,
        packages: formattedPackages,
        info: 'تم استخدام الباقات الافتراضية لعدم وجود باقات في قاعدة البيانات'
      });
    }
    
    // تحويل البيانات من قاعدة البيانات إلى صيغة متوافقة مع واجهة المستخدم
    const formattedPackages = data.map((pkg: any) => ({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      daysCount: pkg.days_count,
      days_count: pkg.days_count,
      discountFrom: pkg.discount_from,
      discount_from: pkg.discount_from,
      isDefault: pkg.is_default,
      is_default: pkg.is_default,
      color: pkg.color || 'from-blue-500 to-blue-700'
    }));
    
    console.log('Returning formatted packages for users:', formattedPackages.length);
    
    // طباعة معلومات مفصلة للتشخيص
    if (formattedPackages.length > 0) {
      console.log('Sample package data from user API:', JSON.stringify(formattedPackages[0]));
      console.log('All packages IDs:', formattedPackages.map(p => p.id).join(', '));
    }
    
    return NextResponse.json({
      success: true,
      packages: formattedPackages,
      source: 'database',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error fetching packages for users:', error);
    
    // في حالة الاستثناءات غير المتوقعة، إرجاع الباقات الافتراضية
    const formattedPackages = DEFAULT_PACKAGES.map(pkg => ({
      id: pkg.id,
      name: pkg.name,
      price: pkg.price,
      daysCount: pkg.days_count,
      days_count: pkg.days_count,
      discountFrom: pkg.discount_from,
      discount_from: pkg.discount_from,
      isDefault: pkg.is_default,
      is_default: pkg.is_default,
      color: pkg.color
    }));
    
    return NextResponse.json({
      success: true,
      packages: formattedPackages,
      info: 'تم استخدام الباقات الافتراضية بسبب خطأ غير متوقع',
      error: error.message
    });
  }
}
