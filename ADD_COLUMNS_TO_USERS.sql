-- إضافة أعمدة مفيدة إلى جدول المستخدمين لتحسين وظائف الموقع

-- 1. أولاً، التحقق من وجود الجدول والأعمدة
-- عرض الأعمدة الموجودة حالياً
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

-- 2. إضافة عمود selected_package_id إذا لم يكن موجوداً
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS selected_package_id UUID;

-- 3. إضافة عمود device_info لتخزين معلومات الجهاز
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS device_info JSONB;

-- 4. إضافة عمود لمتابعة عدد مرات تسجيل الدخول
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS login_count INTEGER DEFAULT 0;

-- 5. إضافة عمود لتتبع آخر تسجيل دخول
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login TIMESTAMPTZ;

-- 6. التأكد من وجود فهارس مناسبة
CREATE INDEX IF NOT EXISTS idx_users_selected_package_id ON public.users(selected_package_id);

-- 7. التحقق من الأعمدة بعد التحديث
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' AND 
    table_name = 'users' AND
    column_name IN ('selected_package_id', 'device_info', 'login_count', 'last_login')
ORDER BY 
    ordinal_position;
