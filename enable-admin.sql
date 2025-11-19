-- منح صلاحيات للمسؤول للتعامل مع جميع الجداول
-- هذا الملف يعطي المستخدم المصادقة جميع الصلاحيات على الجداول والمتسلسلات

-- منح صلاحيات كاملة على الجداول الرئيسية
GRANT ALL ON lectures TO authenticated;
GRANT ALL ON lecture_content TO authenticated;
GRANT ALL ON subjects TO authenticated;
GRANT ALL ON subscriptions TO authenticated;
GRANT ALL ON users TO authenticated;
GRANT ALL ON exams TO authenticated;

-- منح صلاحيات للمتسلسلات
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- تمكين سياسات RLS للأدمن
DROP POLICY IF EXISTS lectures_admin_all ON lectures;
CREATE POLICY lectures_admin_all ON lectures FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS lecture_content_admin_all ON lecture_content;
CREATE POLICY lecture_content_admin_all ON lecture_content FOR ALL TO authenticated USING (true);

DROP POLICY IF EXISTS subjects_admin_all ON subjects;
CREATE POLICY subjects_admin_all ON subjects FOR ALL TO authenticated USING (true);

-- منح صلاحيات تنفيذ الإجراءات
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- إعادة تحميل schema cache
SELECT pg_notify('pgrst', 'reload schema');
