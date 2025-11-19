-- إصلاح جدول lecture_content والتأكد من وجود جميع الأعمدة
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة عمود description إذا لم يكن موجوداً
ALTER TABLE lecture_content ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';

-- إضافة فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_lecture_content_lecture_id ON lecture_content(lecture_id);

-- إضافة وظيفة exec_with_return لتنفيذ استعلامات مخصصة مع استرجاع القيم
CREATE OR REPLACE FUNCTION exec_with_return(sql TEXT, params TEXT[] DEFAULT NULL) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql INTO result USING params;
  RETURN result;
EXCEPTION WHEN OTHERS THEN
  RAISE;
END;
$$;

-- إعادة تحميل schema cache لـ PostgREST
SELECT pg_notify('pgrst', 'reload schema');

-- التحقق من وجود الأعمدة في الجدول
SELECT 
  column_name, 
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns 
WHERE 
  table_schema = 'public' 
  AND table_name = 'lecture_content'
ORDER BY 
  ordinal_position;
