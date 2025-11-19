-- إضافة وظائف SQL للوصول المباشر للبيانات بدون قيود صلاحيات

-- 1. وظيفة لجلب المحاضرات
CREATE OR REPLACE FUNCTION get_lectures(subject_id_param TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(lecture_data)
  INTO result
  FROM (
    SELECT
      jsonb_build_object(
        'id', l.id,
        'title', l.title,
        'description', l.description,
        'subject_id', l.subject_id,
        'order_index', l.order_index,
        'created_at', l.created_at,
        'subject', (
          SELECT jsonb_build_object(
            'id', s.id,
            'title', s.title
          )
          FROM subjects s
          WHERE s.id = l.subject_id
        )
      ) AS lecture_data
    FROM 
      lectures l
    WHERE 
      (subject_id_param IS NULL OR l.subject_id = subject_id_param::uuid)
    ORDER BY 
      l.order_index
  ) subquery;
  
  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 2. وظيفة لجلب محتوى محاضرة واحدة مع محتواها
CREATE OR REPLACE FUNCTION get_lecture_with_content(lecture_id_param TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  lecture_data JSONB;
  content_data JSONB;
BEGIN
  -- جلب بيانات المحاضرة
  SELECT
    jsonb_build_object(
      'id', l.id,
      'title', l.title,
      'description', l.description,
      'subject_id', l.subject_id,
      'order_index', l.order_index,
      'created_at', l.created_at,
      'subject', (
        SELECT jsonb_build_object(
          'id', s.id,
          'title', s.title
        )
        FROM subjects s
        WHERE s.id = l.subject_id
      )
    )
  INTO lecture_data
  FROM 
    lectures l
  WHERE 
    l.id = lecture_id_param::uuid;
    
  -- جلب محتوى المحاضرة
  SELECT jsonb_agg(content_item)
  INTO content_data
  FROM (
    SELECT
      jsonb_build_object(
        'id', lc.id,
        'lecture_id', lc.lecture_id,
        'type', lc.type,
        'title', lc.title,
        'description', COALESCE(lc.description, ''),
        'content_url', lc.content_url,
        'content_text', lc.content_text,
        'duration_minutes', lc.duration_minutes,
        'order_index', lc.order_index,
        'is_downloadable', lc.is_downloadable,
        'created_at', lc.created_at
      ) AS content_item
    FROM 
      lecture_content lc
    WHERE 
      lc.lecture_id = lecture_id_param::uuid
    ORDER BY 
      lc.order_index
  ) subquery;
  
  -- دمج البيانات
  IF lecture_data IS NOT NULL THEN
    lecture_data = lecture_data || jsonb_build_object('content', COALESCE(content_data, '[]'::jsonb));
    RETURN lecture_data;
  ELSE
    RETURN NULL;
  END IF;
END;
$$;

-- منح صلاحيات استخدام الوظائف للجميع
GRANT EXECUTE ON FUNCTION get_lectures(TEXT) TO PUBLIC;
GRANT EXECUTE ON FUNCTION get_lecture_with_content(TEXT) TO PUBLIC;

-- التأكد من إعادة تحميل schema cache
SELECT pg_notify('pgrst', 'reload schema');
