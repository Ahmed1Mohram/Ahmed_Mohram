import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-client';

const escapeLiteral = (value: string) => value.replace(/'/g, "''");

export async function POST(req: NextRequest) {
  try {
    console.log('بدء معالجة طلب الدفع المبسط...');
    
    const formData = await req.formData();
    const packageName = formData.get('packageName') as string;
    const price = formData.get('price') as string;
    const duration = formData.get('duration') as string;
    const paymentMethod = formData.get('paymentMethod') as string;
    const receipt = formData.get('receipt') as File | null;
    const userId = formData.get('userId') as string;
    
    console.log('البيانات المستلمة:', { 
      packageName, 
      price, 
      duration, 
      paymentMethod,
      userId,
      hasReceipt: receipt ? true : false 
    });

    if (!userId) {
      return NextResponse.json({ 
        error: 'معرف المستخدم غير متوفر',
        code: 'MISSING_USER_ID' 
      }, { status: 400 });
    }
    
    if (!packageName || !price) {
      return NextResponse.json({ 
        error: 'بيانات الباقة ناقصة',
        code: 'MISSING_PACKAGE_DATA' 
      }, { status: 400 });
    }

    // معالجة رفع الصورة إذا وجدت
    let receiptUrl = null;
    if (receipt) {
      try {
        // التحقق من نوع الملف
        const fileType = receipt.type;
        if (!fileType.startsWith('image/')) {
          return NextResponse.json({ 
            error: 'نوع الملف غير مدعوم. يرجى رفع صورة فقط',
            code: 'INVALID_FILE_TYPE' 
          }, { status: 400 });
        }
        
        // التحقق من حجم الملف (أقل من 5 ميجابايت)
        const fileSizeMB = receipt.size / (1024 * 1024);
        if (fileSizeMB > 5) {
          return NextResponse.json({ 
            error: 'حجم الملف كبير جدًا. الحد الأقصى هو 5 ميجابايت',
            code: 'FILE_TOO_LARGE' 
          }, { status: 400 });
        }
        
        // تحويل الملف إلى مصفوفة بايت
        const arrayBuffer = await receipt.arrayBuffer();
        const buffer = new Uint8Array(arrayBuffer);
        
        // إنشاء اسم ملف فريد
        const timestamp = Date.now();
        const fileExt = receipt.name.split('.').pop() || 'jpg';
        const fileName = `receipts/${userId}_${timestamp}.${fileExt}`;
        
        // رفع الصورة إلى التخزين
        const { data: uploadData, error: uploadError } = await supabaseAdmin
          .storage
          .from('payment_receipts')
          .upload(fileName, buffer, {
            contentType: receipt.type,
            upsert: true
          });
          
        if (uploadError) {
          console.error('Error uploading receipt:', uploadError);
          throw new Error('فشل رفع صورة الإيصال');
        }
        
        // الحصول على URL العام للصورة
        const { data: urlData } = await supabaseAdmin
          .storage
          .from('payment_receipts')
          .getPublicUrl(fileName);
          
        receiptUrl = urlData?.publicUrl || null;
        console.log('Receipt uploaded successfully, URL:', receiptUrl);
        
      } catch (fileError: any) {
        console.error('Error processing receipt file:', fileError);
        return NextResponse.json({ 
          error: 'فشل معالجة ملف الإيصال',
          details: fileError?.message || 'خطأ غير معروف',
          code: 'FILE_PROCESSING_ERROR' 
        }, { status: 500 });
      }
    }

    // حفظ بيانات الطلب في جدول بديل بسيط
    try {
      // التأكد من وجود جدول subscription_requests والأعمدة اللازمة في users
      try {
        await supabaseAdmin.rpc('exec', {
          sql: `
            CREATE TABLE IF NOT EXISTS public.subscription_requests (
              id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id UUID REFERENCES public.users(id),
              package_name TEXT NOT NULL,
              price INTEGER NOT NULL,
              days_count INTEGER,
              payment_method TEXT,
              receipt_url TEXT,
              status TEXT DEFAULT 'pending',
              details JSONB,
              created_at TIMESTAMPTZ DEFAULT NOW(),
              updated_at TIMESTAMPTZ DEFAULT NOW()
            );

            ALTER TABLE public.users
              ADD COLUMN IF NOT EXISTS package_name TEXT,
              ADD COLUMN IF NOT EXISTS amount INTEGER,
              ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
          `
        });
      } catch (ensureError) {
        console.log('Non-critical: failed to ensure subscription_requests/users columns schema', ensureError);
      }
      // تحويل المدة إلى أيام
      const daysCount = parseInt((duration || '30').replace(/\D/g, '')) || 30;

      // إعداد تفاصيل الطلب كـ JSON
      const requestDetails = {
        packageName,
        price,
        duration,
        paymentMethod,
        timestamp: new Date().toISOString()
      };
      const detailsJson = JSON.stringify(requestDetails);

      // إعداد قيم آمنة للسلاسل النصية في SQL
      const safePackageName = escapeLiteral(packageName);
      const safePaymentMethod = escapeLiteral(paymentMethod || 'vodafone_cash');
      const safeDetails = escapeLiteral(detailsJson);
      const safeReceiptUrl = receiptUrl ? escapeLiteral(receiptUrl as string) : null;

      const insertSql = `
        INSERT INTO public.subscription_requests
          (user_id, package_name, price, days_count, payment_method, receipt_url, status, details, created_at, updated_at)
        VALUES (
          '${userId}'::uuid,
          '${safePackageName}',
          ${parseInt(price)},
          ${daysCount},
          '${safePaymentMethod}',
          ${safeReceiptUrl ? `'${safeReceiptUrl}'` : 'NULL'},
          'pending',
          '${safeDetails}'::jsonb,
          NOW(),
          NOW()
        );
      `;

      const { error: insertError } = await supabaseAdmin.rpc('exec', { sql: insertSql });
      if (insertError) {
        console.error('Error saving subscription request via exec:', insertError);
        throw new Error('فشل حفظ طلب الاشتراك');
      }
      
      // تحديث بيانات المستخدم
      await supabaseAdmin
        .from('users')
        .update({
          package_name: packageName,
          amount: parseInt(price),
          status: 'pending',
          payment_proof_url: receiptUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);
        
      // إرسال إشعار للمدير (بدون انتظار النتيجة)
      try {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'payment',
            title: 'طلب اشتراك جديد',
            message: `طلب اشتراك جديد من المستخدم في ${packageName} بمبلغ ${price} جنيه`,
            is_read: false,
            created_at: new Date().toISOString()
          });
        console.log('Notification sent');
      } catch (notifError) {
        console.log('Notification error (non-critical):', notifError);
      }
      
      return NextResponse.json({
        success: true,
        message: 'تم إرسال طلب الاشتراك بنجاح'
      });
      
    } catch (dbError: any) {
      console.error('Database error:', dbError);
      return NextResponse.json({
        error: 'حدث خطأ في حفظ بيانات الاشتراك',
        details: dbError?.message || 'خطأ في قاعدة البيانات',
        code: dbError?.code || 'DB_ERROR'
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('API error:', error);
    console.error('API error stack:', error.stack);
    
    return NextResponse.json({ 
      error: error.message || 'حدث خطأ غير متوقع',
      errorType: error.name,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
