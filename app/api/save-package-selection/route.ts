import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-client';

const supabase = supabaseAdmin;

// دالة لتخزين معلومات متصفح المستخدم
function parseUserAgent(userAgentString: string) {
  // معلومات أساسية عن المتصفح ونظام التشغيل
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Unknown';
  
  // تحديد نوع المتصفح
  if (userAgentString.includes('Chrome') && !userAgentString.includes('Edg')) {
    browser = 'Chrome';
  } else if (userAgentString.includes('Firefox')) {
    browser = 'Firefox';
  } else if (userAgentString.includes('Safari') && !userAgentString.includes('Chrome')) {
    browser = 'Safari';
  } else if (userAgentString.includes('Edg')) {
    browser = 'Edge';
  } else if (userAgentString.includes('MSIE') || userAgentString.includes('Trident')) {
    browser = 'Internet Explorer';
  }
  
  // تحديد نظام التشغيل
  if (userAgentString.includes('Windows')) {
    os = 'Windows';
  } else if (userAgentString.includes('Mac OS')) {
    os = 'MacOS';
  } else if (userAgentString.includes('Linux')) {
    os = 'Linux';
  } else if (userAgentString.includes('Android')) {
    os = 'Android';
  } else if (userAgentString.includes('iPhone') || userAgentString.includes('iPad') || userAgentString.includes('iPod')) {
    os = 'iOS';
  }
  
  // تحديد نوع الجهاز
  if (userAgentString.includes('Mobile') || userAgentString.includes('iPhone') || userAgentString.includes('Android') && userAgentString.includes('Mobile')) {
    device = 'Mobile';
  } else if (userAgentString.includes('iPad') || userAgentString.includes('Android') && !userAgentString.includes('Mobile')) {
    device = 'Tablet';
  } else {
    device = 'Desktop';
  }
  
  return {
    browser,
    os,
    device,
    fullUserAgent: userAgentString
  };
}

export async function POST(req: NextRequest) {
  try {
    const { userId, packageId, packageName, price } = await req.json();
    console.log('Received package selection data:', { userId, packageId, packageName, price });
    
    if (!userId || !packageId) {
      console.error('Missing required fields');
      return NextResponse.json(
        { error: 'معرف المستخدم والباقة مطلوبان', success: false },
        { status: 400 }
      );
    }
    
    // جلب معلومات المتصفح
    const userAgent = req.headers.get('user-agent') || '';
    const deviceInfo = parseUserAgent(userAgent);
    console.log('Device info:', deviceInfo);
    
    // حفظ اختيار الباقة في جدول المستخدمين
    // فقط تحديث الحقول المتوفرة في الجدول
    const { error: updateError, data } = await supabase
      .from('users')
      .update({
        package_name: packageName,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select();
    
    if (updateError) {
      console.error('Error updating user with selected package:', updateError);
      throw updateError;
    }

    console.log('User updated successfully:', data);
    
    return NextResponse.json({
      success: true,
      message: 'تم حفظ اختيار الباقة بنجاح',
      data
    });
  } catch (error: any) {
    console.error('Error saving package selection:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حفظ اختيار الباقة', success: false },
      { status: 500 }
    );
  }
}