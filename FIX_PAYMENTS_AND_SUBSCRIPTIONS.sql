-- التحقق من جداول الدفع والاشتراك
-- هذا السكريبت يقوم بإصلاح العلاقة بين جداول payments و subscriptions ويتأكد من ظهور كل طلبات الدفع في جدول الاشتراكات

-- 1. التحقق من وجود جدول الدفع
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  amount INTEGER NOT NULL,
  payment_method TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. التحقق من وجود جدول الاشتراكات
-- ملاحظة: تم حذف عمود payment_id و receipt_url لأنهما غير موجودين في الجدول الحالي
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

-- 3. إضافة الفهارس إذا لم تكن موجودة
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(status);

-- 4. نقل بيانات من جدول payments إلى جدول subscriptions لأي دفعة ليس لها اشتراك
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
SELECT 
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
JOIN
  public.users u ON p.user_id = u.id
LEFT JOIN
  public.subscriptions s ON s.user_id = p.user_id
WHERE 
  s.id IS NULL
ON CONFLICT DO NOTHING;

-- 5. إضافة قيود اشتراك للطلبات التي ليس لها إيصالات أو بيانات اشتراك
-- هذه الخطوة تساعد في إظهار المستخدمين الذين لديهم طلبات دفع ولكن ليس لديهم اشتراكات
INSERT INTO public.subscriptions (
  user_id, 
  package_name, 
  price, 
  days_count, 
  start_date, 
  expiry_date, 
  status
)
SELECT 
  u.id,
  'باقة الشهر الواحد',
  200,
  30,
  NOW(),
  (NOW() + INTERVAL '30 days'),
  'pending'
FROM 
  public.users u
LEFT JOIN
  public.subscriptions s ON s.user_id = u.id
WHERE 
  s.id IS NULL
ON CONFLICT DO NOTHING;

-- 6. تعيين حالة اشتراك المستخدمين حسب حالة الاشتراك
UPDATE public.users u
SET subscription_status = 'active'
FROM public.subscriptions s
WHERE s.user_id = u.id AND s.status = 'active' AND u.subscription_status != 'active';

-- 7. عرض نتائج الجداول بعد التحديث
SELECT 'Payments Count' as table_name, COUNT(*) as record_count FROM public.payments
UNION ALL
SELECT 'Subscriptions Count', COUNT(*) FROM public.subscriptions
UNION ALL
SELECT 'Users with Payments', COUNT(DISTINCT user_id) FROM public.payments
UNION ALL
SELECT 'Users with Subscriptions', COUNT(DISTINCT user_id) FROM public.subscriptions
UNION ALL
SELECT 'Pending Subscriptions', COUNT(*) FROM public.subscriptions WHERE status = 'pending'
UNION ALL
SELECT 'Active Subscriptions', COUNT(*) FROM public.subscriptions WHERE status = 'active';

-- 8. إعادة تحميل المخطط
SELECT pg_reload_conf();
