-- ملف لاستكشاف أخطاء عرض محتوى المحاضرات

-- 1. التحقق من وجود جدول lecture_content
SELECT EXISTS (
    SELECT FROM 
        information_schema.tables 
    WHERE 
        table_schema = 'public' 
        AND table_name = 'lecture_content'
);

-- 2. فحص هيكل الجدول للتأكد من وجود جميع الأعمدة الضرورية
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'lecture_content';

-- 3. التحقق من وجود محتوى فعلي في الجدول
SELECT COUNT(*) FROM lecture_content;

-- 4. عرض عينة من المحتوى للتأكد من وجود بيانات صحيحة
SELECT id, lecture_id, type, title, content_url 
FROM lecture_content
LIMIT 5;

-- 5. التحقق من العلاقة بين المحاضرات والمحتوى
SELECT 
    l.id AS lecture_id, 
    l.title AS lecture_title, 
    COUNT(lc.id) AS content_count
FROM 
    lectures l
LEFT JOIN 
    lecture_content lc ON l.id = lc.lecture_id
GROUP BY 
    l.id, l.title;

-- 6. التحقق من سياسات الأمان على جدول lecture_content
SELECT 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual, 
    with_check
FROM 
    pg_policies
WHERE 
    tablename = 'lecture_content';

-- 7. التحقق من حقوق الوصول الأساسية
SELECT 
    grantee, table_name, privilege_type
FROM 
    information_schema.role_table_grants
WHERE 
    table_name = 'lecture_content';

-- 8. إصلاح شامل للسياسات (إزالة ثم إعادة الإنشاء)
DROP POLICY IF EXISTS lecture_content_read_policy ON lecture_content;
DROP POLICY IF EXISTS lecture_content_admin_policy ON lecture_content;

-- إنشاء سياسة جديدة تسمح للجميع بالقراءة بدون شروط
CREATE POLICY lecture_content_public_read_policy ON lecture_content
  FOR SELECT TO PUBLIC
  USING (true);

-- إنشاء سياسة للأدمن تسمح بالتعديل الكامل
CREATE POLICY lecture_content_admin_policy ON lecture_content
  FOR ALL TO authenticated
  USING (true);

-- 9. التأكد من أن RLS مفعلة
ALTER TABLE lecture_content ENABLE ROW LEVEL SECURITY;

-- 10. منح صلاحيات أساسية
GRANT SELECT ON lecture_content TO PUBLIC;
GRANT ALL ON lecture_content TO authenticated;

-- 11. إعادة تحميل schema cache
SELECT pg_notify('pgrst', 'reload schema');
