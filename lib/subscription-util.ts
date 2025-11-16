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

    // التحقق من انتهاء الاشتراك
    const isActive = userData.subscription_status === 'active';
    const endDate = userData.subscription_end_date ? new Date(userData.subscription_end_date) : null;
    const now = new Date();
    
    // حساب الأيام المتبقية
    let daysLeft = 0;
    if (endDate && endDate > now) {
      const diffTime = endDate.getTime() - now.getTime();
      daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }
    
    // التحقق مما إذا كان الاشتراك منتهيًا
    let status = userData.subscription_status;
    let active = isActive;
    
    if (isActive && endDate && endDate < now) {
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
      subscription_end_date: userData.subscription_end_date,
      days_left: daysLeft,
      package_name: userData.package_name
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
