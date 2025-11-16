import { NextResponse } from 'next/server';
import { supabaseClient } from '@/lib/db-client';
import { errorResponse, successResponse, ErrorCodes } from '@/lib/error-handler';
import { checkSubscriptionStatus } from '@/lib/subscription-util';

// استخدام عميل قاعدة البيانات الموحد
const supabase = supabaseClient;

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * التحقق من حالة الاشتراك للمستخدم الحالي
 * GET /api/check-subscription
 */
export async function GET(req: Request) {
  try {
    // محاولة الحصول على المستخدم من headers أو cookies
    const authHeader = req.headers.get('authorization')
    const userId = req.headers.get('x-user-id')
    
    // إذا لم يكن هناك auth، نرجع حالة غير نشطة
    if (!authHeader && !userId) {
      return successResponse({
        subscription_status: 'inactive',
        active: false
      }, 'لم يتم توفير بيانات المصادقة')
    }

    // الحصول على المستخدم الحالي
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (!user && !userId) {
      return successResponse({
        subscription_status: 'inactive',
        active: false
      }, 'المستخدم غير موجود')
    }

    const userIdToCheck = user?.id || userId as string
    
    // استخدام الأداة المساعدة للتحقق من حالة الاشتراك
    const subscriptionStatus = await checkSubscriptionStatus(userIdToCheck);

    return successResponse({
      subscription_status: subscriptionStatus.status,
      subscription_end_date: subscriptionStatus.subscription_end_date,
      active: subscriptionStatus.active,
      days_left: subscriptionStatus.days_left,
      package_name: subscriptionStatus.package_name
    }, 'تم التحقق من حالة الاشتراك بنجاح');

  } catch (error) {
    return errorResponse(ErrorCodes.SERVER_ERROR, {
      details: error,
      customMessage: 'حدث خطأ أثناء التحقق من الاشتراك'
    });
  }
}
