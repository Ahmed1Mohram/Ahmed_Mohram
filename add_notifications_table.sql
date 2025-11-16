-- التحقق من وجود جدول notifications وإنشاؤه إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء فهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE notifications IS 'إشعارات المستخدمين';
COMMENT ON COLUMN notifications.user_id IS 'معرف المستخدم المرتبط بالإشعار';
COMMENT ON COLUMN notifications.type IS 'نوع الإشعار (approval, message, system, etc.)';
COMMENT ON COLUMN notifications.is_read IS 'هل قرأ المستخدم الإشعار';

-- إعادة تحميل المخطط
SELECT pg_reload_conf();
