-- إصلاح علاقات المحاضرات والمحتوى

-- 1. التأكد من وجود جدول محتوى المحاضرات
CREATE TABLE IF NOT EXISTS lecture_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  content_url TEXT,
  content_text TEXT,
  duration_minutes INT,
  order_index INT DEFAULT 1,
  is_downloadable BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. إصلاح الفهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_lecture_content_lecture_id ON lecture_content(lecture_id);

-- 3. إضافة حق الوصول لمستخدمي النظام
ALTER TABLE IF EXISTS lecture_content ENABLE ROW LEVEL SECURITY;

-- 4. إنشاء سياسة للقراءة تسمح للمستخدمين العاديين بقراءة المحتوى
-- إزالة الخيار IF NOT EXISTS لأنه غير مدعوم في السياسات
DROP POLICY IF EXISTS lecture_content_read_policy ON lecture_content;
CREATE POLICY lecture_content_read_policy ON lecture_content
  FOR SELECT USING (true);

-- 5. إنشاء سياسة للإدارة تسمح للأدمن بالتعديل
-- إزالة الخيار IF NOT EXISTS لأنه غير مدعوم في السياسات
DROP POLICY IF EXISTS lecture_content_admin_policy ON lecture_content;
CREATE POLICY lecture_content_admin_policy ON lecture_content
  FOR ALL USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND role = 'admin')
  );

-- 6. التحقق من وجود المحاضرات المرتبطة ببعض
SELECT l.id, l.title, COUNT(lc.id) AS content_count
FROM lectures l
LEFT JOIN lecture_content lc ON lc.lecture_id = l.id
GROUP BY l.id, l.title
ORDER BY l.title;

-- 7. إعادة تحميل schema cache لـ PostgREST
SELECT pg_notify('pgrst', 'reload schema');
