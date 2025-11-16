-- تنظيف قاعدة البيانات من المستخدمين القدامى

-- حذف جميع المستخدمين ما عدا الأدمن
DELETE FROM users 
WHERE email != 'admin@education.com';

-- أو حذف مستخدم معين برقم الهاتف
DELETE FROM users 
WHERE phone_number = '01005209667' 
AND role != 'admin';

-- عرض جميع المستخدمين الموجودين
SELECT id, email, full_name, phone_number, role, status 
FROM users;

-- إعادة تعيين جدول المستخدمين بالكامل (خطر!)
-- TRUNCATE TABLE users CASCADE;

-- إضافة الأدمن فقط
INSERT INTO users (
  id,
  email, 
  full_name, 
  phone_number, 
  role, 
  status, 
  subscription_status
)
VALUES (
  gen_random_uuid(),
  'admin@education.com', 
  'أحمد محرم', 
  '01005209667', 
  'admin', 
  'approved', 
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  status = 'approved',
  subscription_status = 'active';
