import { supabaseClient } from './db-client';

/**
 * واجهة بيانات المستخدم المعروضة للعميل
 */
export interface UserProfile {
  id: string;
  email: string;
  full_name?: string;
  phone_number?: string;
  subscription_status?: string;
  subscription_end_date?: string;
  created_at?: string;
}

/**
 * خدمة المصادقة المركزية - واجهة لعمليات المصادقة
 */
export const AuthService = {
  /**
   * تسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور
   */
  async signInWithEmail(email: string, password: string) {
    try {
      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // جلب بيانات المستخدم من جدول المستخدمين
      if (data.user) {
        const { data: userData, error: profileError } = await supabaseClient
          .from('users')
          .select('*')
          .eq('id', data.user.id)
          .maybeSingle();

        if (profileError) console.error('Error fetching user profile:', profileError);

        // تنسيق بيانات المستخدم
        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          full_name: userData?.full_name,
          phone_number: userData?.phone_number,
          subscription_status: userData?.subscription_status,
          subscription_end_date: userData?.subscription_end_date,
          created_at: userData?.created_at
        };

        return {
          user: userProfile,
          session: data.session
        };
      }

      return { user: null, session: null };
    } catch (error) {
      console.error('SignIn error:', error);
      throw error;
    }
  },

  /**
   * تسجيل الدخول باستخدام رقم الهاتف وكلمة المرور
   */
  async signInWithPhone(phoneNumber: string, password: string) {
    try {
      // البحث عن المستخدم برقم الهاتف أولاً
      const { data: userData } = await supabaseClient
        .from('users')
        .select('id, email')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (!userData || !userData.email) {
        throw new Error('لم يتم العثور على مستخدم بهذا الرقم');
      }

      // استخدام البريد الإلكتروني للمستخدم للدخول
      return this.signInWithEmail(userData.email, password);
    } catch (error) {
      console.error('SignIn with phone error:', error);
      throw error;
    }
  },

  /**
   * إنشاء حساب جديد
   */
  async signUp(email: string, password: string, fullName: string, phoneNumber: string) {
    try {
      // التحقق من عدم وجود حساب بنفس البريد الإلكتروني أو رقم الهاتف
      const { data: existingUserData } = await supabaseClient
        .from('users')
        .select('id')
        .or(`email.eq.${email},phone_number.eq.${phoneNumber}`)
        .maybeSingle();

      if (existingUserData) {
        throw new Error('البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل');
      }

      // إنشاء حساب جديد
      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        // إنشاء ملف شخصي للمستخدم
        const { error: profileError } = await supabaseClient
          .from('users')
          .insert({
            id: data.user.id,
            email: data.user.email,
            full_name: fullName,
            phone_number: phoneNumber,
            subscription_status: 'inactive'
          });

        if (profileError) {
          console.error('Error creating user profile:', profileError);
          // حذف الحساب المنشأ في حالة فشل إنشاء الملف الشخصي
          await supabaseClient.auth.admin.deleteUser(data.user.id);
          throw new Error('فشل إنشاء الملف الشخصي');
        }

        const userProfile: UserProfile = {
          id: data.user.id,
          email: data.user.email || '',
          full_name: fullName,
          phone_number: phoneNumber,
          subscription_status: 'inactive'
        };

        return {
          user: userProfile,
          session: data.session
        };
      }

      return { user: null, session: null };
    } catch (error) {
      console.error('SignUp error:', error);
      throw error;
    }
  },

  /**
   * تسجيل الخروج
   */
  async signOut() {
    return supabaseClient.auth.signOut();
  },

  /**
   * التحقق من حالة تسجيل الدخول
   */
  async getCurrentUser() {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      
      if (!user) return null;
      
      // جلب بيانات المستخدم من جدول المستخدمين
      const { data: userData, error } = await supabaseClient
        .from('users')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
      
      const userProfile: UserProfile = {
        id: user.id,
        email: user.email || '',
        full_name: userData?.full_name,
        phone_number: userData?.phone_number,
        subscription_status: userData?.subscription_status,
        subscription_end_date: userData?.subscription_end_date,
        created_at: userData?.created_at
      };
      
      return userProfile;
    } catch (error) {
      console.error('Get current user error:', error);
      return null;
    }
  },
  
  /**
   * التحقق من حالة الاشتراك
   */
  async checkSubscription(userId: string) {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('subscription_status, subscription_end_date')
        .eq('id', userId)
        .maybeSingle();
      
      if (error) throw error;
      
      const isActive = data?.subscription_status === 'active';
      const isExpired = data?.subscription_end_date ? 
        new Date(data.subscription_end_date) < new Date() : 
        true;
      
      return {
        status: isExpired ? 'expired' : data?.subscription_status,
        endDate: data?.subscription_end_date,
        active: isActive && !isExpired
      };
    } catch (error) {
      console.error('Check subscription error:', error);
      throw error;
    }
  }
};

export default AuthService;
