-- إصلاح شامل لصلاحيات عرض المحاضرات
-- قم بتنفيذ هذا الملف مباشرة على قاعدة البيانات كمسؤول

-- 1. إعادة ضبط صلاحيات جداول المحتوى الرئيسية
ALTER TABLE lectures ENABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

-- 2. إزالة أي سياسات قد تتسبب في مشاكل
DROP POLICY IF EXISTS lectures_read_policy ON lectures;
DROP POLICY IF EXISTS lecture_content_read_policy ON lecture_content;
DROP POLICY IF EXISTS lecture_content_admin_policy ON lecture_content;
DROP POLICY IF EXISTS subjects_read_policy ON subjects;

-- 3. إعادة إنشاء سياسات عامة بسيطة وواضحة تسمح لجميع المستخدمين بالقراءة
-- سياسة للمحاضرات: السماح لأي مستخدم بقراءة كل المحاضرات
CREATE POLICY lectures_public_select ON lectures 
  FOR SELECT USING (true);

-- سياسة لمحتوى المحاضرات: السماح لأي مستخدم بقراءة كل المحتوى  
CREATE POLICY lecture_content_public_select ON lecture_content 
  FOR SELECT USING (true);

-- سياسة للمواضيع: السماح لأي مستخدم بقراءة كل المواضيع
CREATE POLICY subjects_public_select ON subjects 
  FOR SELECT USING (true);

-- 4. إنشاء سياسات خاصة للأدمن للتعديل
-- سياسة للأدمن للتعديل على المحاضرات
CREATE POLICY lectures_admin_all ON lectures 
  FOR ALL TO authenticated 
  USING (true);

-- سياسة للأدمن للتعديل على محتوى المحاضرات
CREATE POLICY lecture_content_admin_all ON lecture_content 
  FOR ALL TO authenticated 
  USING (true);

-- سياسة للأدمن للتعديل على المواضيع
CREATE POLICY subjects_admin_all ON subjects 
  FOR ALL TO authenticated 
  USING (true);

-- 5. منح صلاحيات قراءة صريحة للجميع
GRANT SELECT ON lectures TO public;
GRANT SELECT ON lecture_content TO public;
GRANT SELECT ON subjects TO public;

-- 6. منح صلاحيات كاملة للمستخدمين المسجلين (الأدمن)
GRANT ALL ON lectures TO authenticated;
GRANT ALL ON lecture_content TO authenticated;
GRANT ALL ON subjects TO authenticated;

-- 7. ضمان وجود تسلسلات للمفاتيح إن وجدت
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO public;

-- 8. إعادة تحميل schema cache لتطبيق التغييرات فورًا
SELECT pg_notify('pgrst', 'reload schema');
