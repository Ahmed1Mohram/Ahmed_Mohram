-- إنشاء جدول subscriptions إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  package_id UUID,
  package_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  days_count INTEGER NOT NULL,
  start_date TIMESTAMPTZ DEFAULT NOW(),
  expiry_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending',
  payment_id UUID,
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهارس لتسريع عمليات البحث
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expiry_date ON subscriptions(expiry_date);

-- إنشاء الاشتراكات التي تم حفظها في جدول payments
INSERT INTO public.subscriptions (
  user_id, 
  package_name, 
  price, 
  days_count, 
  start_date, 
  expiry_date, 
  status, 
  payment_id, 
  payment_method, 
  receipt_url, 
  created_at
)
SELECT 
  p.user_id, 
  COALESCE(u.package_name, 'باقة الشهر الواحد') as package_name,
  p.amount as price,
  30 as days_count,
  p.created_at as start_date,
  (p.created_at + INTERVAL '30 days') as expiry_date,
  p.status,
  p.id as payment_id,
  p.payment_method,
  p.receipt_url,
  p.created_at
FROM 
  public.payments p
JOIN
  public.users u ON p.user_id = u.id
WHERE 
  NOT EXISTS (
    SELECT 1 
    FROM public.subscriptions s 
    WHERE s.payment_id = p.id
  )
ON CONFLICT DO NOTHING;

-- إعادة تحميل ذاكرة التخزين المؤقت للمخطط
SELECT pg_reload_conf();
