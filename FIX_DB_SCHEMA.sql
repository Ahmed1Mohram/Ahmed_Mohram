-- إصلاح هيكل قاعدة البيانات لمعالجة أخطاء الدفع والاشتراكات

-- إنشاء جدول الاشتراكات إذا لم يكن موجوداً
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

-- إنشاء الفهارس اللازمة لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- إنشاء جدول طلبات الاشتراك كجدول احتياطي
CREATE TABLE IF NOT EXISTS public.subscription_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  package_name TEXT NOT NULL,
  price INTEGER NOT NULL,
  days_count INTEGER,
  payment_method TEXT,
  receipt_url TEXT,
  status TEXT DEFAULT 'pending',
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء الفهارس اللازمة للجدول الاحتياطي
CREATE INDEX IF NOT EXISTS idx_subscription_requests_user_id ON subscription_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_requests_status ON subscription_requests(status);

-- إنشاء جدول الإشعارات إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  type TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء الفهارس اللازمة لتحسين أداء الإشعارات
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

-- إصلاح حقول المستخدمين إذا كان ذلك ضرورياً
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS package_name TEXT,
ADD COLUMN IF NOT EXISTS amount INTEGER,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

-- إعادة تحميل مخطط قاعدة البيانات
SELECT pg_reload_conf();
