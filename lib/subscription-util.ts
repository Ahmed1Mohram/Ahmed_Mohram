import { supabaseAdmin } from './db-client';

/**
 * واجهة حالة الاشتراك
 */
interface SubscriptionStatus {
  active: boolean;
  status: 'active' | 'inactive' | 'expired' | 'pending';
  subscription_end_date?: string;
  days_left?: number;
  package_name?: string;
}

/**
 * التحقق من حالة الاشتراك للمستخدم
 * @param userId معرف المستخدم
 * @returns حالة الاشتراك والمعلومات ذات الصلة
 */
export async function checkSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
  try {
    if (!userId) {
      return { active: false, status: 'inactive' };
    }

    // جلب بيانات المستخدم
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('subscription_status, subscription_end_date, package_name')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !userData) {
      console.error('Error fetching user subscription data:', userError);
      return { active: false, status: 'inactive' };
    }
    
    // استخدام حالة المستخدم كنقطة بداية
    let status: 'active' | 'inactive' | 'expired' | 'pending' = userData.subscription_status;
    let subscriptionEndDate: string | undefined = userData.subscription_end_date || undefined;
    let packageName: string | undefined = userData.package_name || undefined;

    // محاولة الحصول على أحدث اشتراك فعّال من جدول الاشتراكات لمزامنة الحالة
    try {
      const { data: subRows, error: subError } = await supabaseAdmin
        .from('subscriptions')
        .select('status, expiry_date, package_name')
        .eq('user_id', userId)
        .order('expiry_date', { ascending: false })
        .limit(1);

      if (!subError && subRows && subRows.length > 0) {
        const latestSub = subRows[0] as { status: string; expiry_date: string | null; package_name?: string | null };
        const nowForSub = new Date();
        const subEnd = latestSub.expiry_date ? new Date(latestSub.expiry_date) : null;

        if (latestSub.status === 'active' && subEnd && subEnd > nowForSub) {
          status = 'active';
          subscriptionEndDate = latestSub.expiry_date || undefined;
          if (latestSub.package_name) {
            packageName = latestSub.package_name || packageName;
          }

          // مزامنة حالة المستخدم مع جدول الاشتراكات إذا كانت مختلفة
          if (
            userData.subscription_status !== 'active' ||
            userData.subscription_end_date !== subscriptionEndDate ||
            userData.package_name !== packageName
          ) {
            try {
              await supabaseAdmin
                .from('users')
                .update({
                  subscription_status: 'active',
                  subscription_end_date: subscriptionEndDate,
                  package_name: packageName,
                  updated_at: new Date().toISOString()
                })
                .eq('id', userId);
            } catch (syncError) {
              console.error('Error syncing user subscription from subscriptions table:', syncError);
            }
          }
        }
      }
    } catch (subCheckError) {
      console.error('Error checking subscriptions table for user:', subCheckError);
    }

    // التحقق من انتهاء الاشتراك بناءً على التاريخ النهائي الحالي
    const now = new Date();
    const endDate = subscriptionEndDate ? new Date(subscriptionEndDate) : null;
    
    // حساب الأيام المتبقية
    let daysLeft = 0;
    if (endDate && endDate > now) {
      const diffTime = endDate.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    let active = status === 'active';

    // إذا كان مسجل كـ active لكن التاريخ انتهى، نعتبره منتهيًا ونحدّث قاعدة البيانات
    if (active && endDate && endDate < now) {
      status = 'expired';
      active = false;
      
      // تحديث حالة الاشتراك في قاعدة البيانات
      try {
        await supabaseAdmin
          .from('users')
          .update({ 
            subscription_status: 'expired',
            updated_at: new Date().toISOString()
          })
          .eq('id', userId);
      } catch (updateError) {
        console.error('Error updating subscription status:', updateError);
      }
    }
    
    return {
      active,
      status,
      subscription_end_date: subscriptionEndDate,
      days_left: daysLeft,
      package_name: packageName
    };
    
  } catch (error) {
    console.error('Error checking subscription status:', error);
    return { active: false, status: 'inactive' };
  }
}

/**
 * تفعيل اشتراك المستخدم
 * @param userId معرف المستخدم
 * @param daysCount عدد أيام الاشتراك
 * @param packageName اسم الباقة
 * @returns نجاح العملية
 */
export async function activateSubscription(
  userId: string, 
  daysCount: number = 30,
  packageName: string = 'باقة شهر'
): Promise<boolean> {
  try {
    if (!userId) return false;

    // حساب تاريخ انتهاء الاشتراك
    const now = new Date();
    const endDate = new Date(now.getTime() + daysCount * 24 * 60 * 60 * 1000);
    
    // تحديث بيانات المستخدم
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        subscription_status: 'active',
        subscription_end_date: endDate.toISOString(),
        package_name: packageName,
        updated_at: now.toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error activating subscription:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error activating subscription:', error);
    return false;
  }
}

/**
 * تمديد اشتراك المستخدم
 * @param userId معرف المستخدم
 * @param additionalDays عدد أيام التمديد
 * @returns نجاح العملية
 */
export async function extendSubscription(
  userId: string, 
  additionalDays: number
): Promise<boolean> {
  try {
    if (!userId || additionalDays <= 0) return false;

    // جلب بيانات الاشتراك الحالية
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('subscription_status, subscription_end_date')
      .eq('id', userId)
      .maybeSingle();

    if (userError || !userData) {
      console.error('Error fetching user data for extension:', userError);
      return false;
    }

    // حساب تاريخ الانتهاء الجديد
    let newEndDate: Date;
    const now = new Date();
    
    if (userData.subscription_end_date) {
      // استخدام تاريخ الانتهاء الحالي كأساس للتمديد
      const currentEndDate = new Date(userData.subscription_end_date);
      // استخدم التاريخ الأحدث من الآن أو تاريخ الانتهاء الحالي
      const baseDate = currentEndDate > now ? currentEndDate : now;
      newEndDate = new Date(baseDate.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    } else {
      // لا يوجد تاريخ انتهاء حالي، نبدأ من الآن
      newEndDate = new Date(now.getTime() + additionalDays * 24 * 60 * 60 * 1000);
    }
    
    // تحديث بيانات المستخدم
    const { error } = await supabaseAdmin
      .from('users')
      .update({ 
        subscription_status: 'active',
        subscription_end_date: newEndDate.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', userId);

    if (error) {
      console.error('Error extending subscription:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error extending subscription:', error);
    return false;
  }
}
