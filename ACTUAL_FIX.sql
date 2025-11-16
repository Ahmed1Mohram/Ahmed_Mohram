-- إصلاح مشكلة العلاقة بين جدولي الاشتراكات والمدفوعات

-- 1. إنشاء جدول الاشتراكات إذا لم يكن موجوداً بالفعل
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

-- 2. إنشاء الفهارس اللازمة
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- 3. التأكد من وجود جدول المدفوعات
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

-- 4. إنشاء حقل لربط المدفوعات بالاشتراكات
ALTER TABLE public.payments
ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.subscriptions(id);

-- 5. إنشاء فهرس لحقل subscription_id
CREATE INDEX IF NOT EXISTS idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON public.payments(user_id);

-- 6. تنشيط Foreign Key Referential Integrity
DO $$
BEGIN
  -- إضافة Foreign Key Constraint للعلاقة بين الجدولين إذا لم تكن موجودة
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'fk_payments_subscription_id'
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT fk_payments_subscription_id
    FOREIGN KEY (subscription_id)
    REFERENCES public.subscriptions(id)
    ON DELETE SET NULL;
  END IF;
END;
$$;

-- 7. إعادة تحميل ذاكرة التخزين المؤقت للمخطط
SELECT pg_reload_conf();
