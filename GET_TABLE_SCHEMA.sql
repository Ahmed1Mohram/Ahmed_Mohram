-- استعلام لمعرفة بنية جدول الاشتراكات
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' AND 
  table_name = 'subscriptions'
ORDER BY 
  ordinal_position;

-- استعلام لمعرفة بنية جدول المدفوعات
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM 
  information_schema.columns
WHERE 
  table_schema = 'public' AND 
  table_name = 'payments'
ORDER BY 
  ordinal_position;

-- استعلام لمعرفة عدد السجلات
SELECT 'Payments Count' as table_name, COUNT(*) as record_count FROM public.payments
UNION ALL
SELECT 'Subscriptions Count', COUNT(*) FROM public.subscriptions;

-- عرض عدد المستخدمين حسب حالة الاشتراك
SELECT subscription_status, COUNT(*) as user_count
FROM public.users
GROUP BY subscription_status;

-- عرض السجلات الأولى من كل جدول
SELECT 'First 3 payments' as info;
SELECT * FROM public.payments LIMIT 3;

SELECT 'First 3 subscriptions' as info;
SELECT * FROM public.subscriptions LIMIT 3;
