-- إضافة/تحديث مستخدم تجريبي بالرقم 01005209666 ليعمل مع /api/login-direct

INSERT INTO public.users (
  email,
  full_name,
  phone_number,
  role,
  status,
  subscription_status
)
VALUES (
  'student01005209666@education.com',
  'طالب 01005209666',
  '01005209666',
  'student',
  'approved',
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone_number = EXCLUDED.phone_number,
  role = 'student',
  status = 'approved',
  subscription_status = 'active';

-- ملاحظة: عمود password_hash يظل NULL، وأول تسجيل دخول عبر /api/login-direct
-- سيخزّن كلمة المرور التي تكتبها في هذا الحقل تلقائياً.
