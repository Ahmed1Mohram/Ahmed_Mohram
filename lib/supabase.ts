import { createClient } from '@supabase/supabase-js'

// الإعدادات الثابتة من ملف .env.local
const SUPABASE_URL = 'https://tkvzxsuozjbmcmrxqpkt.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRrdnp4c3VvempibWNtcnhxcGt0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMzMjQzOTAsImV4cCI6MjA3ODkwMDM5MH0.UuCNPp7MRwSA8ROtyzvz-1l-2EJc93r1jhQFm9eQZcU'
// تأكد من تعبئة مفتاح service role الصحيح من Supabase Dashboard -> Settings -> API
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || 'service-role-key-here'

// إنشاء عميل Supabase للاستخدام العام (للمستخدم)
export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true
    }
  }
)

// إنشاء عميل Supabase للمسؤول (للعمليات الإدارية)
export const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// أخرى للاستخدام في API
export function getSupabaseAdmin() {
  return createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}

export function getSupabaseClient() {
  return createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      auth: {
        autoRefreshToken: true,
        persistSession: true
      }
    }
  )
}
