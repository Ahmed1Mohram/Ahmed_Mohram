import { createClient } from '@supabase/supabase-js'

// الإعدادات الثابتة من ملف .env.local
const SUPABASE_URL = 'https://fsvwusrpuiczznzgnyvd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdnd1c3JwdWljenpuemdueXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODY2MjEsImV4cCI6MjA3ODQ2MjYyMX0.hB6Z0rt0L8miLcPRSPrnjkMb4Mcq6Y_gK-ihbuEb70o'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdnd1c3JwdWljenpuemdueXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4NjYyMSwiZXhwIjoyMDc4NDYyNjIxfQ.nNVpkQodQkZ5RULi1R7yLHizr2ig58FbCNV6VBrxwc4'

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
  SUPABASE_SERVICE_ROLE_KEY,
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
    SUPABASE_SERVICE_ROLE_KEY,
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
