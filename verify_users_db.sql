-- التحقق من المستخدمين الموجودين وحالاتهم
SELECT id, email, phone_number, full_name, status, subscription_status, subscription_end_date 
FROM users
ORDER BY created_at DESC;

-- عرض عدد المستخدمين حسب الحالة
SELECT status, COUNT(*) as user_count
FROM users
GROUP BY status;

-- تحديث جميع المستخدمين إلى حالة approved (اختياري)
-- UPDATE users SET status = 'approved' WHERE status = 'pending';

-- إضافة فهرس للبحث السريع عن المستخدمين حسب رقم الهاتف أو البريد الإلكتروني
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- التحقق من بيانات جدول الباقات
SELECT * FROM packages;

-- إعادة تحميل المخطط
SELECT pg_reload_conf();
