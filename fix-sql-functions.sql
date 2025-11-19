-- إضافة وظيفة مساعدة لتنفيذ استعلامات SQL مع استرجاع النتائج
CREATE OR REPLACE FUNCTION exec_with_return(sql TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSONB;
BEGIN
  EXECUTE sql INTO result;
  RETURN COALESCE(result, '[]'::jsonb);
EXCEPTION 
  WHEN OTHERS THEN
    RAISE EXCEPTION 'SQL Error: %', SQLERRM;
END;
$$;

-- منح صلاحيات استخدام هذه الوظيفة للجميع
GRANT EXECUTE ON FUNCTION exec_with_return(TEXT) TO PUBLIC;
