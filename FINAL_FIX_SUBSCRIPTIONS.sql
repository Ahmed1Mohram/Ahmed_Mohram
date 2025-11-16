-- سكريبت نهائي لإصلاح جداول المستخدمين والدفعات والاشتراكات
-- يتم تنفيذ هذا السكريبت مرة واحدة لإصلاح قاعدة البيانات

-- 1. إضافة الأعمدة المفقودة إلى جدول المستخدمين
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS package_name TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS amount INTEGER DEFAULT 0;

-- 2. إنشاء جدول الاشتراكات إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  package_id TEXT,
  package_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  days_count INTEGER NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. إضافة الفهارس اللازمة
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 4. إضافة عمود للربط بين الدفعات والاشتراكات
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS subscription_id UUID;

-- 5. إنشاء اشتراكات للمستخدمين الذين لديهم دفعات
INSERT INTO public.subscriptions (
  user_id, 
  package_name, 
  price, 
  days_count, 
  start_date, 
  expiry_date, 
  status, 
  payment_method, 
  created_at
)
SELECT DISTINCT ON (p.user_id)
  p.user_id, 
  'باقة الشهر الواحد' as package_name,
  p.amount as price,
  30 as days_count,
  p.created_at as start_date,
  (p.created_at + INTERVAL '30 days') as expiry_date,
  p.status,
  p.payment_method,
  p.created_at
FROM 
  public.payments p
LEFT JOIN
  public.subscriptions s ON s.user_id = p.user_id
WHERE 
  s.id IS NULL
ORDER BY 
  p.user_id, p.created_at DESC
ON CONFLICT DO NOTHING;

-- 6. ربط الدفعات بالاشتراكات المنشأة حديثاً
UPDATE public.payments p
SET subscription_id = s.id
FROM public.subscriptions s
WHERE s.user_id = p.user_id AND p.subscription_id IS NULL;

-- 7. تحديث حالة اشتراك المستخدمين بناءً على حالة آخر اشتراك لهم
UPDATE public.users u
SET subscription_status = CASE 
  WHEN s.status = 'active' THEN 'active'
  WHEN s.status = 'pending' THEN 'pending'
  ELSE 'inactive'
END
FROM (
  SELECT DISTINCT ON (user_id) 
    user_id, 
    status
  FROM 
    public.subscriptions
  ORDER BY 
    user_id, created_at DESC
) s
WHERE s.user_id = u.id;

-- 8. تحديث حقل package_name في جدول المستخدمين
UPDATE public.users u
SET package_name = s.package_name
FROM public.subscriptions s
WHERE s.user_id = u.id AND u.package_name IS NULL;

-- 9. عرض الإحصائيات النهائية
SELECT 'Users Count' as table_name, COUNT(*) as record_count FROM public.users
UNION ALL
SELECT 'Payments Count', COUNT(*) FROM public.payments
UNION ALL
SELECT 'Subscriptions Count', COUNT(*) FROM public.subscriptions
UNION ALL
SELECT 'Users with Subscriptions', COUNT(DISTINCT user_id) FROM public.subscriptions
UNION ALL
SELECT 'Pending Subscriptions', COUNT(*) FROM public.subscriptions WHERE status = 'pending'
UNION ALL
SELECT 'Active Subscriptions', COUNT(*) FROM public.subscriptions WHERE status = 'active';

-- 10. إعادة تحميل المخطط
SELECT pg_reload_conf();
