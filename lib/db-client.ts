import { createClient } from '@supabase/supabase-js'

// بيانات الاتصال بقاعدة البيانات
// استخدام قيم من ملف .env.local أو القيم الافتراضية إذا لم تكن موجودة
export const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
export const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
export const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || ''

// عميل Supabase العام للعمليات العامة - استخدام مفتاح تخزين مختلف
export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'education-platform-anon-key' // مفتاح تخزين خاص لتجنب التداخل
  }
})

// عميل Supabase للإدارة مع صلاحيات كاملة (مفتاح الخدمة)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    storageKey: 'education-platform-admin-key' // مفتاح تخزين خاص للإدارة
  }
})

/**
 * دالة مساعدة للحصول على عميل Supabase للمستخدم الحالي
 * @param accessToken - رمز وصول المستخدم إذا كان متوفراً
 * @returns عميل Supabase للمستخدم
 */
export function getUserClient(accessToken?: string) {
  if (accessToken) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      },
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        storageKey: `education-platform-user-${accessToken.substring(0, 8)}` // مفتاح تخزين فريد لكل مستخدم
      }
    })
  }
  return supabaseClient
}
