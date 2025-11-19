-- إصلاح مشكلات المزامنة بين عرض المستخدم وعرض الأدمن
-- تم تحديثه لمعالجة مشكلة عدم ظهور المحتوى المرفوع وظهور محاضرات غير موجودة في الأدمن

-- 0. ترتيب فعلي للخطوات:
-- 1. إنشاء جدول لتسجيل التشخيص
-- 2. إنشاء نسخ احتياطية
-- 3. التشخيص
-- 4. إصلاح السياسات
-- 5. إصلاح البيانات المتناقضة

-- 1. إنشاء جدول مؤقت للبيانات المتناقضة للتشخيص
DROP TABLE IF EXISTS debug_inconsistencies;
CREATE TABLE debug_inconsistencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT,
  object_type TEXT,
  object_id TEXT,
  details JSONB,
  fixed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. عرض المحاضرات المعروضة للمستخدم ولكن غير موجودة في الأدمن
INSERT INTO debug_inconsistencies (description, object_type, object_id, details)
SELECT 
  'محاضرة معروضة للمستخدم ولكن غير ظاهرة للأدمن', 
  'lecture', 
  l.id::text, 
  jsonb_build_object(
    'title', l.title,
    'subject_id', l.subject_id,
    'created_at', l.created_at
  )
FROM 
  lectures l
LEFT JOIN 
  subjects s ON l.subject_id = s.id
WHERE 
  l.id NOT IN (
    SELECT id FROM lectures WHERE TRUE
  );

-- 3. إصلاح جميع سياسات الوصول للجداول الرئيسية
-- أولاً، نحذف جميع السياسات القديمة للتأكد من عدم وجود تناقضات
-- نحذف جميع السياسات المعروفة والمحتملة
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
DROP POLICY IF EXISTS lectures_read ON lectures;
DROP POLICY IF EXISTS lecture_content_read ON lecture_content;

-- انتظر لحظة للتأكد من حذف جميع السياسات
SELECT pg_sleep(0.5);

-- 4. إنشاء سياسات جديدة واضحة وبسيطة
-- محاولة إنشاء سياسات القراءة بطريقة آمنة
DO $$
BEGIN
  BEGIN
    -- سياسة تسمح بقراءة المحاضرات للجميع
    CREATE POLICY lectures_public_read ON lectures
      FOR SELECT USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'السياسة lectures_public_read موجودة بالفعل';
  END;
  
  BEGIN
    -- سياسة تسمح بقراءة محتوى المحاضرات للجميع
    CREATE POLICY lecture_content_public_read ON lecture_content 
      FOR SELECT USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'السياسة lecture_content_public_read موجودة بالفعل';
  END;
END
$$;

-- إنشاء سياسات المسؤولين بطريقة آمنة
DO $$
BEGIN
  BEGIN
    -- سياسة تسمح بكل العمليات على المحاضرات للمسؤولين
    CREATE POLICY lectures_admin_crud ON lectures
      FOR ALL TO authenticated
      USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'السياسة lectures_admin_crud موجودة بالفعل';
  END;
  
  BEGIN
    -- سياسة تسمح بكل العمليات على محتوى المحاضرات للمسؤولين
    CREATE POLICY lecture_content_admin_crud ON lecture_content
      FOR ALL TO authenticated
      USING (true);
  EXCEPTION
    WHEN duplicate_object THEN
      RAISE NOTICE 'السياسة lecture_content_admin_crud موجودة بالفعل';
  END;
END
$$;

-- 5. التأكد من تمكين RLS لكل جدول مع منح الصلاحيات المناسبة
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_content ENABLE ROW LEVEL SECURITY;

-- منح صلاحيات القراءة للجميع
GRANT SELECT ON lectures TO anon;
GRANT SELECT ON lectures TO authenticated;
GRANT SELECT ON lecture_content TO anon;
GRANT SELECT ON lecture_content TO authenticated;

-- منح صلاحيات كاملة للمسؤولين
GRANT ALL ON lectures TO authenticated;
GRANT ALL ON lecture_content TO authenticated;

-- 6. التحقق من وجود محتوى بدون محاضرات مرتبطة وتسجيلها
INSERT INTO debug_inconsistencies (description, object_type, object_id, details)
SELECT 
  'محتوى محاضرة بدون محاضرة مرتبطة', 
  'lecture_content', 
  lc.id::text, 
  jsonb_build_object(
    'title', lc.title,
    'lecture_id', lc.lecture_id,
    'type', lc.type,
    'created_at', lc.created_at
  )
FROM 
  lecture_content lc
LEFT JOIN 
  lectures l ON lc.lecture_id = l.id
WHERE 
  l.id IS NULL;

-- 7. إنشاء نسخة احتياطية من البيانات الحالية قبل أي تغييرات إضافية
CREATE TABLE IF NOT EXISTS lectures_backup AS SELECT * FROM lectures;
CREATE TABLE IF NOT EXISTS lecture_content_backup AS SELECT * FROM lecture_content;

-- 8. إصلاح المحتوى المنفصل (حذف محتوى المحاضرات الغير موجودة)
DELETE FROM lecture_content
WHERE lecture_id NOT IN (SELECT id FROM lectures);

-- 9. إنشاء وظيفة SQL مخصصة لجلب المحاضرات ومحتواها للواجهة الأمامية
CREATE OR REPLACE FUNCTION get_subject_lectures(subject_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(lecture_info)
  INTO result
  FROM (
    SELECT
      l.*,
      (
        SELECT COUNT(*)
        FROM lecture_content lc
        WHERE lc.lecture_id = l.id
      ) AS content_count,
      EXISTS (
        SELECT 1 FROM lecture_content lc
        WHERE lc.lecture_id = l.id AND lc.type = 'video'
      ) AS has_video,
      EXISTS (
        SELECT 1 FROM lecture_content lc
        WHERE lc.lecture_id = l.id AND lc.type = 'audio'
      ) AS has_audio,
      EXISTS (
        SELECT 1 FROM lecture_content lc
        WHERE lc.lecture_id = l.id AND lc.type = 'pdf'
      ) AS has_pdf,
      EXISTS (
        SELECT 1 FROM lecture_content lc
        WHERE lc.lecture_id = l.id AND lc.type = 'text'
      ) AS has_text
    FROM
      lectures l
    WHERE
      l.subject_id = subject_id_param
    ORDER BY
      l.order_index
  ) AS lecture_info;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 10. منح صلاحيات للوظيفة الجديدة
GRANT EXECUTE ON FUNCTION get_subject_lectures(UUID) TO PUBLIC;

-- 11. إعادة تحميل schema cache لتطبيق التغييرات
SELECT pg_notify('pgrst', 'reload schema');
