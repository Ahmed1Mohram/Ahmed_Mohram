import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-client';

 

// معالجة الإيصالات المرفوعة
export async function POST(req: NextRequest) {
  try {
    // قراءة البيانات من الطلب
    const formData = await req.formData();
    const userId = formData.get('userId') as string;
    const receiptImage = formData.get('receiptImage') as File;
    const packageId = formData.get('packageId') as string;
    
    if (!userId || !receiptImage || !packageId) {
      return NextResponse.json({ 
        success: false, 
        message: 'البيانات المطلوبة غير مكتملة' 
      }, { status: 400 });
    }

    // التأكد من وجود حاوية التخزين العامة الصحيحة
    const bucketName = 'payment_receipts'
    try {
      // التحقق مما إذا كانت الحاوية موجودة
      const { data: buckets } = await (supabaseAdmin as any).storage.listBuckets?.()
      const exists = Array.isArray(buckets) && buckets.some((b: any) => b.name === bucketName)
      if (!exists) {
        try { await (supabaseAdmin as any).storage.createBucket(bucketName, { public: true }) } catch {}
      } else {
        try { await (supabaseAdmin as any).storage.updateBucket?.(bucketName, { public: true }) } catch {}
      }
    } catch {}
    
    // حفظ صورة الإيصال في Storage
    const ext = String(receiptImage.name || '').split('.').pop() || 'png'
    const objectPath = `receipts/${userId}_${Date.now()}.${ext}`
    
    const { data: uploadData, error: uploadError } = await supabaseAdmin
      .storage
      .from(bucketName)
      .upload(objectPath, receiptImage, {
        cacheControl: '3600',
        contentType: receiptImage.type,
        upsert: true,
      });
    
    if (uploadError) {
      console.error('خطأ في رفع الإيصال:', uploadError);
      return NextResponse.json({
        success: false,
        message: 'فشل في رفع صورة الإيصال',
        error: uploadError.message
      }, { status: 500 });
    }
    
    // الحصول على URL للصورة المرفوعة
    const { data: urlData } = await supabaseAdmin
      .storage
      .from(bucketName)
      .getPublicUrl(objectPath);
    
    const receiptUrl = urlData?.publicUrl;
    
    // التأكد من وجود جدول طلبات الاشتراك
    try {
      const SQL = `
        CREATE TABLE IF NOT EXISTS subscription_requests (
          id TEXT PRIMARY KEY,
          user_id TEXT,
          package_id TEXT,
          receipt_url TEXT,
          status TEXT DEFAULT 'pending',
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
      await supabaseAdmin.rpc('exec', { sql: SQL })
    } catch {}

    // إنشاء طلب اشتراك جديد
    const requestId = (globalThis as any).crypto?.randomUUID
      ? (globalThis as any).crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

    const { data: subscriptionRequest, error: subscriptionError } = await supabaseAdmin
      .from('subscription_requests')
      .insert({
        id: requestId,
        user_id: userId,
        package_id: packageId,
        receipt_url: receiptUrl,
        status: 'pending'
      })
      .select('id')
      .single()
    
    if (subscriptionError) {
      console.error('خطأ في إنشاء طلب الاشتراك:', subscriptionError);
      return NextResponse.json({
        success: false,
        message: 'فشل في إنشاء طلب الاشتراك',
        error: subscriptionError.message
      }, { status: 500 });
    }
    
    // إرسال إشعار للأدمن (يمكن إضافته لاحقًا)
    
    return NextResponse.json({
      success: true,
      message: 'تم إرسال طلب الاشتراك بنجاح',
      data: {
        requestId: subscriptionRequest?.id || requestId,
        receiptUrl
      }
    });
    
  } catch (error: any) {
    console.error('خطأ في معالجة الإيصال:', error);
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ في معالجة الإيصال',
      error: error.message || 'خطأ غير معروف'
    }, { status: 500 });
  }
}

// الحصول على معلومات عن الإيصالات
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get('userId');
    
    // التحقق من المستخدم
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: 'معرف المستخدم مطلوب'
      }, { status: 400 });
    }
    
    // جلب طلبات الاشتراك للمستخدم
    const { data, error } = await supabaseAdmin
      .from('subscription_requests')
      .select(`
        id,
        created_at,
        status,
        receipt_url,
        package_id,
        packages (
          id,
          name,
          price,
          days_count
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('خطأ في جلب طلبات الاشتراك:', error);
      return NextResponse.json({
        success: false,
        message: 'فشل في جلب طلبات الاشتراك',
        error: error.message
      }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      data
    });
    
  } catch (error: any) {
    console.error('خطأ في جلب معلومات الإيصالات:', error);
    return NextResponse.json({
      success: false,
      message: 'حدث خطأ في جلب معلومات الإيصالات',
      error: error.message || 'خطأ غير معروف'
    }, { status: 500 });
  }
}