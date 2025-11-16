-- التحقق من بنية جدول المستخدمين
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' AND 
  table_name = 'users'
ORDER BY 
  ordinal_position;

-- إضافة أعمدة جديدة لتتبع حالة الاشتراك والباقة
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS package_name TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;

-- تحديث حالة الاشتراك للمستخدمين حسب سجلات الاشتراك
UPDATE public.users u
SET subscription_status = 'active'
FROM public.subscriptions s
WHERE s.user_id = u.id AND s.status = 'active' AND (u.subscription_status IS NULL OR u.subscription_status != 'active');

-- تحديث اسم الباقة للمستخدمين حسب سجلات الاشتراك
UPDATE public.users u
SET package_name = s.package_name
FROM public.subscriptions s
WHERE s.user_id = u.id AND u.package_name IS NULL;

-- عرض عدد المستخدمين بكل حالة اشتراك
SELECT 
  COALESCE(subscription_status, 'null') as subscription_status,
  COUNT(*) as user_count
FROM 
  public.users
GROUP BY 
  subscription_status
ORDER BY 
  user_count DESC;
