-- إضافة وظائف لإصلاح الصلاحيات والمزامنة من واجهة API

-- 1. إنشاء وظيفة لإصلاح صلاحيات الجداول
CREATE OR REPLACE FUNCTION fix_permissions()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- حذف السياسات الموجودة لتجنب التعارض
  DROP POLICY IF EXISTS lectures_read_policy ON lectures;
  DROP POLICY IF EXISTS lecture_content_read_policy ON lecture_content;
  DROP POLICY IF EXISTS lectures_admin_policy ON lectures;
  DROP POLICY IF EXISTS lecture_content_admin_policy ON lecture_content;
  DROP POLICY IF EXISTS lectures_public_select ON lectures;
  DROP POLICY IF EXISTS lecture_content_public_select ON lecture_content;
  DROP POLICY IF EXISTS lectures_admin_all ON lectures;
  DROP POLICY IF EXISTS lecture_content_admin_all ON lecture_content;
  DROP POLICY IF EXISTS lectures_public_read ON lectures;
  DROP POLICY IF EXISTS lecture_content_public_read ON lecture_content;
  DROP POLICY IF EXISTS lectures_admin_crud ON lectures;
  DROP POLICY IF EXISTS lecture_content_admin_crud ON lecture_content;
  
  -- تمكين RLS
  ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
  ALTER TABLE lecture_content ENABLE ROW LEVEL SECURITY;
  
  -- إنشاء سياسات جديدة
  -- سياسات القراءة للجميع
  CREATE POLICY lectures_public_read ON lectures
    FOR SELECT USING (true);
  
  CREATE POLICY lecture_content_public_read ON lecture_content 
    FOR SELECT USING (true);
  
  -- سياسات للمسؤولين
  CREATE POLICY lectures_admin_crud ON lectures
    FOR ALL TO authenticated
    USING (true);
  
  CREATE POLICY lecture_content_admin_crud ON lecture_content
    FOR ALL TO authenticated
    USING (true);
  
  -- منح الصلاحيات الأساسية
  GRANT SELECT ON lectures TO anon;
  GRANT SELECT ON lectures TO authenticated;
  GRANT SELECT ON lecture_content TO anon;
  GRANT SELECT ON lecture_content TO authenticated;
  GRANT ALL ON lectures TO authenticated;
  GRANT ALL ON lecture_content TO authenticated;
  
  -- منح صلاحيات للمتسلسلات
  GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
END;
$$;

-- 2. إنشاء وظيفة لإعادة تحميل schema cache
CREATE OR REPLACE FUNCTION reload_schema()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM pg_notify('pgrst', 'reload schema');
END;
$$;

-- 3. منح صلاحيات تنفيذ الوظائف
GRANT EXECUTE ON FUNCTION fix_permissions() TO authenticated;
GRANT EXECUTE ON FUNCTION reload_schema() TO authenticated;

-- 4. تنفيذ وظيفة إصلاح الصلاحيات مباشرة
SELECT fix_permissions();

-- 5. إعادة تحميل schema cache
SELECT pg_notify('pgrst', 'reload schema');
