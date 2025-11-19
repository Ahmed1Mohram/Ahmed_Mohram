'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { supabaseClient } from '@/lib/db-client'

// استخدام عميل قاعدة البيانات الموحد
export const supabase = supabaseClient

// Context للمصادقة
interface AuthContextType {
  user: any
  loading: boolean
  isAdmin: boolean // إضافة خاصية المسؤول
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<any>
  signIn: (identifier: string, password: string, isPhone?: boolean) => Promise<any>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkUser()
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    })

    return () => {
      authListener?.subscription.unsubscribe()
    }
  }, [])

  async function checkUser() {
    try {
      // 1. التحقق من cookies أولاً
      let adminFromCookies = false;
      let userFromCookies = null;
      
      try {
        // التحقق من كوكيز الأدمن
        if (typeof document !== 'undefined') {
          const cookieString = document.cookie;
          const cookies = cookieString.split(';').map(cookie => cookie.trim());
          const isAdminCookie = cookies.find(cookie => cookie.startsWith('isAdmin='));
          
          if (isAdminCookie) {
            adminFromCookies = isAdminCookie.split('=')[1] === 'true';
            console.log('✅ وجدنا حالة أدمن في cookies:', adminFromCookies);
            
            // إذا وجدنا أدمن في cookies ولم يكن لدينا مستخدم في localStorage
            const storedUser = localStorage.getItem('user');
            if (adminFromCookies && !storedUser) {
              // إنشاء مستخدم افتراضي للأدمن
              userFromCookies = {
                id: 'admin-via-cookie',
                email: 'admin@example.com',
                role: 'admin',
                full_name: 'أحمد محرم'
              };
              console.log('✅ إنشاء مستخدم افتراضي من cookies');
            }
          }
        }
      } catch (cookieError) {
        console.error('خطأ في قراءة cookies:', cookieError);
      }
      
      // 2. جلب بيانات المستخدم من Supabase
      console.log('جلب بيانات المستخدم...');
      const { data: { user } } = await supabase.auth.getUser();
      let adminStatus = adminFromCookies; // اعتبر المستخدم أدمن إذا كان كذلك في cookies
      
      // إذا كان لدينا أدمن من cookies ولا يوجد مستخدم من Supabase
      if (userFromCookies && !user) {
        setUser(userFromCookies);
        setIsAdmin(true);
        setLoading(false);
        return;
      }
      
      if (!user) {
        try {
          const storedUserStr = typeof localStorage !== 'undefined' ? localStorage.getItem('user') : null;
          if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr);
            setUser(storedUser);
            setIsAdmin(storedUser?.role === 'admin');
            setLoading(false);
            return;
          }
        } catch (e) {
          console.error('خطأ في قراءة المستخدم من localStorage:', e);
        }
      }
      
      // 3. التحقق مما إذا كان المستخدم مسؤولاً
      if (user) {
        console.log('تم العثور على المستخدم:', user.email);
        setUser(user);
        
        // التحقق من جدول المستخدمين أولاً
        try {
          // محاولة التحقق من قاعدة البيانات
          const { data: userData, error } = await supabase
            .from('users')
            .select('role')
            .eq('id', user.id)
            .maybeSingle();
            
          if (userData && userData.role === 'admin') {
            console.log('المستخدم مسؤول بناءً على قاعدة البيانات');
            adminStatus = true;
          } else if (!userData || error) {
            console.log('خطأ في جلب دور المستخدم، جاري فحص نمط البريد الإلكتروني');
            
            // فحص بديل: تحقق من البريد الإلكتروني
            const isAdminEmail = user.email?.includes('admin') || 
                               user.email === 'ahmed.moharram2020@gmail.com' ||
                               user.email?.endsWith('@education.com');
                               
            if (isAdminEmail) {
              console.log('المستخدم مسؤول بناءً على نمط البريد');
              adminStatus = true;
            }
          }
        } catch (roleError) {
          console.error('خطأ في التحقق من دور المسؤول:', roleError);
          
          // محاولة احتياطية: تحقق من البريد الإلكتروني
          const isAdminEmail = user.email?.includes('admin') || 
                             user.email === 'ahmed.moharram2020@gmail.com' ||
                             user.email?.endsWith('@education.com');
          adminStatus = !!isAdminEmail;
        }
        
        // تخزين حالة المسؤول في localStorage و cookies
        try {
          localStorage.setItem('isAdmin', adminStatus ? 'true' : 'false');
          // حفظ في cookies أيضاً للـ middleware
          document.cookie = `isAdmin=${adminStatus ? 'true' : 'false'}; path=/; max-age=${24 * 60 * 60}`; // 24 ساعة
          console.log('تم تخزين حالة المسؤول:', adminStatus);
          
          // تخزين معلومات المستخدم مع دوره
          const userWithRole = { ...user, role: adminStatus ? 'admin' : 'user' };
          localStorage.setItem('user', JSON.stringify(userWithRole));
        } catch (storageError) {
          console.error('خطأ في تخزين حالة المسؤول:', storageError);
        }
      } else {
        console.log('لم يتم العثور على مستخدم');
        setUser(null);
        adminStatus = false;
        
        // إذا كان هناك جلسة عبر الكوكيز (loggedIn=true) فلا نمسح الكوكيز ولا localStorage
        try {
          const cookieString = typeof document !== 'undefined' ? document.cookie : '';
          const hasCookieLogin = cookieString.includes('loggedIn=true');
          if (!hasCookieLogin) {
            localStorage.removeItem('isAdmin');
            localStorage.removeItem('user');
            // مسح cookies أيضاً
            document.cookie = 'isAdmin=; path=/; max-age=0';
            document.cookie = 'loggedIn=; path=/; max-age=0';
            document.cookie = 'role=; path=/; max-age=0';
            document.cookie = 'status=; path=/; max-age=0';
            document.cookie = 'subscription_status=; path=/; max-age=0';
          } else {
            console.log('تخطي مسح الكوكيز لأن جلسة الكوكيز موجودة');
          }
        } catch (storageError) {
          console.error('خطأ في مسح البيانات من localStorage:', storageError);
        }
      }
      
      // تعيين حالة المسؤول في تطبيق React
      setIsAdmin(adminStatus);
    } catch (error) {
      console.error('خطأ في التحقق من المستخدم:', error)
      setIsAdmin(false);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (!user?.id) return
    // لا نتحقق من الجهاز داخل صفحات الأدمن نهائيًا
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) return
    // تخطى التحقق للأدمن أو للمعرفات غير UUID (مثل admin-via-cookie)
    if (isAdmin) return
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(String(user.id))) return
    try {
      ;(async () => {
        const res = await fetch('/api/verify-device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: user.id })
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok || json?.allowed === false) {
          await signOut()
          router.push('/login')
          toast.error(json?.message || 'تم حظر هذا الجهاز')
        }
      })()
    } catch {}
  }, [user?.id, isAdmin])

  useEffect(() => {
    if (!user?.id) return

    // تخطي فحص الحظر للأدمن أو للمعرّفات غير UUID (مثل admin-access, admin-direct, direct-admin-...)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    if (isAdmin || !uuidRegex.test(String(user.id))) return

    let cancelled = false
    const check = async () => {
      try {
        const { data } = await supabase
          .from('users')
          .select('status')
          .eq('id', user.id)
          .maybeSingle()
        if (!cancelled && data?.status === 'banned') {
          await signOut()
          router.push('/login')
          toast.error('تم حظر حسابك')
        }
      } catch {}
    }
    check()
    const iv = setInterval(check, 15000)
    return () => { cancelled = true; clearInterval(iv) }
  }, [user?.id, isAdmin])

  const signUp = async (email: string, password: string, fullName: string, phoneNumber: string) => {
    try {
      console.log('جاري محاولة إنشاء حساب جديد...')
      
      // استخدام API للتسجيل لضمان إضافة المستخدم لقاعدة البيانات
      const response = await fetch('/api/register-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phoneNumber
        })
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'فشل إنشاء الحساب')
      }

      console.log('تم إنشاء الحساب:', result)

      // تسجيل الدخول تلقائياً بعد التسجيل
      try {
        const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
          email: result.user.email,
          password
        })

        if (signInError) {
          console.error('Error signing in after signup:', signInError)
          // لا نرمي خطأ هنا لأن الحساب تم إنشاؤه بنجاح
        }

        return {
          user: result.user,
          session: authData?.session || null
        }
      } catch (signInErr) {
        console.error('SignIn after signup error:', signInErr)
        // إرجاع بيانات المستخدم حتى لو فشل تسجيل الدخول
        return {
          user: result.user,
          session: null
        }
      }
    } catch (error: any) {
      console.error('Signup error:', error)
      throw error
    }
  }

  const signIn = async (identifier: string, password: string, isPhone: boolean = false) => {
    console.log(`محاولة تسجيل الدخول ${isPhone ? 'برقم الهاتف' : 'بالبريد الإلكتروني'}: ${identifier}`);
    
    try {
      // أولاً: حاول تسجيل الدخول المباشر عبر API
      console.log('محاولة تسجيل الدخول المباشر...');
      const response = await fetch('/api/login-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier,
          password,
          isPhone
        })
      });

      if (!response.ok) {
        console.log(`فشل تسجيل الدخول المباشر: ${response.status}`);
        throw new Error('فشل تسجيل الدخول، يرجى التحقق من بيانات الدخول أو التسجيل');
      }

      const result = await response.json();

      if (response.ok && result.success) {
        console.log('تم تسجيل الدخول بنجاح:', result);
        
        // حفظ بيانات المستخدم في localStorage
        localStorage.setItem('user', JSON.stringify(result.user));
        localStorage.setItem('session', JSON.stringify(result.session));
        
        // إذا كان المستخدم أدمن، احفظ حالة الأدمن في localStorage و cookies
        if (result.user.role === 'admin') {
          localStorage.setItem('isAdmin', 'true');
          // حفظ في cookies أيضاً للـ middleware
          document.cookie = 'isAdmin=true; path=/; max-age=' + (24 * 60 * 60); // 24 ساعة
          console.log('تم حفظ حالة الأدمن في localStorage و cookies');
        }
        
        // حفظ Cookies عامة للجلسة حتى يعمل الـ middleware بدون جلسة Supabase
        const maxAge = 24 * 60 * 60; // 24 ساعة
        document.cookie = 'loggedIn=true; path=/; max-age=' + maxAge + '; SameSite=Lax';
        document.cookie = 'role=' + encodeURIComponent(result.user.role || 'student') + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
        document.cookie = 'status=' + encodeURIComponent(result.user.status || 'approved') + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
        document.cookie = 'subscription_status=' + encodeURIComponent(result.user.subscription_status || 'inactive') + '; path=/; max-age=' + maxAge + '; SameSite=Lax';
        console.log('تم حفظ Cookies الجلسة (loggedIn/role/status/subscription_status)');
        
        setUser(result.user);
        setIsAdmin(result.user.role === 'admin');
        toast.success('تم تسجيل الدخول بنجاح');
        return result;
      } else {
        throw new Error(result.error || 'فشل تسجيل الدخول');
      }
    } catch (error: any) {
      console.error('Signin error:', error);
      throw error;
    }
  }

  const signOut = async () => {
    try {
      console.log('بدء عملية تسجيل الخروج...');
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // مسح البيانات من localStorage
      console.log('مسح بيانات localStorage...');
      localStorage.removeItem('user')
      localStorage.removeItem('isAdmin')
      localStorage.removeItem('session')
      
      // مسح cookies بطريقة أكثر فعالية
      console.log('مسح بيانات cookies...');
      document.cookie = 'isAdmin=false; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      document.cookie = 'isAdmin=false; path=/admin; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      document.cookie = 'isAdmin=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      document.cookie = 'isAdmin=; path=/admin; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      document.cookie = 'loggedIn=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      document.cookie = 'role=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      document.cookie = 'status=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      document.cookie = 'subscription_status=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 UTC;'
      
      setUser(null)
      setIsAdmin(false)
      router.push('/')
      toast.success('تم تسجيل الخروج')
    } catch (error: any) {
      console.error('Signout error:', error)
      toast.error('خطأ في تسجيل الخروج')
    }
  }

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
