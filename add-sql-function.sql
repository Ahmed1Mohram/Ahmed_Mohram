-- إضافة وظيفة SQL لجلب محتوى المحاضرة مباشرة
-- هذه الوظيفة تتخطى قيود Row Level Security وتسمح بجلب المحتوى بشكل مباشر

-- الوظيفة تعيد مصفوفة من JSON تمثل عناصر محتوى المحاضرة
CREATE OR REPLACE FUNCTION get_lecture_content(lecture_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- تسمح بالوصول بصلاحيات منشئ الوظيفة
AS $$
DECLARE
  result JSONB;
BEGIN
  -- التعديل لتجنب خطأ استخدام ORDER BY مع aggregate function
  -- نحن نرتب البيانات في استعلام داخلي قبل التجميع
  SELECT 
    jsonb_agg(item_data)
  INTO result
  FROM (
    SELECT
      jsonb_build_object(
        'id', lc.id,
        'lecture_id', lc.lecture_id,
        'type', lc.type,
        'title', lc.title,
        'description', COALESCE(lc.description, ''),
        'content_url', lc.content_url,
        'thumbnail_url', lc.thumbnail_url,
        'content_text', lc.content_text,
        'duration_minutes', lc.duration_minutes,
        'order_index', lc.order_index,
        'is_downloadable', lc.is_downloadable,
        'created_at', lc.created_at
      ) AS item_data
    FROM 
      lecture_content lc
    WHERE 
      lc.lecture_id = lecture_id_param::uuid
    ORDER BY 
      lc.order_index
  ) subquery;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- منح صلاحيات استخدام الوظيفة للجميع
GRANT EXECUTE ON FUNCTION get_lecture_content(TEXT) TO PUBLIC;

-- التأكد من وجود سياسات تسمح بقراءة جدول lecture_content
DROP POLICY IF EXISTS lecture_content_public_read ON lecture_content;
CREATE POLICY lecture_content_public_read ON lecture_content 
  FOR SELECT TO PUBLIC USING (true);

-- منح صلاحيات القراءة للجميع
GRANT SELECT ON lecture_content TO PUBLIC;

-- التأكد من أن RLS مفعلة مع سياسات مناسبة
ALTER TABLE lecture_content ENABLE ROW LEVEL SECURITY;

-- اختبار الوظيفة
SELECT get_lecture_content('00000000-0000-0000-0000-000000000000') AS test_empty;
