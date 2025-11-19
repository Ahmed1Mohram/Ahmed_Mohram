-- إنشاء وظيفة exec التي تسمح بتنفيذ أوامر SQL عبر RPC
CREATE OR REPLACE FUNCTION public.exec(sql text) 
RETURNS void AS $$
BEGIN
  EXECUTE sql;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- منح الصلاحيات للوظيفة
GRANT EXECUTE ON FUNCTION public.exec TO service_role;

-- التحقق من وجود عمود duration_days في جدول packages وإضافته إذا لم يكن موجوداً
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'packages' 
        AND column_name = 'duration_days'
    ) THEN
        ALTER TABLE public.packages ADD COLUMN duration_days INTEGER DEFAULT 30;
    END IF;
END $$;

-- إنشاء جدول packages إذا لم يكن موجوداً
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  features JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول users
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  password_hash TEXT,
  role TEXT DEFAULT 'student',
  status TEXT DEFAULT 'pending',
  subscription_status TEXT DEFAULT 'inactive',
  subscription_end_date TIMESTAMPTZ,
  avatar_url TEXT,
  bio TEXT,
  payment_proof_url TEXT,
  device_fingerprint TEXT,  
  banned_devices JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  package_id UUID REFERENCES public.packages(id),
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'active',
  payment_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- إنشاء جدول site_settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إعادة تعريف الإدراج للباقات مع استخدام حقل duration_days الذي أضيف للتو
DO $$
BEGIN
    -- التحقق من وجود بيانات في جدول الباقات
    IF NOT EXISTS (SELECT 1 FROM public.packages LIMIT 1) THEN
        -- إضافة البيانات إذا كان الجدول فارغاً
        INSERT INTO public.packages (name, price, duration_days, description, features)
        VALUES 
            ('شهر واحد', 200, 30, 'باقة شهر واحد', '["وصول كامل", "جميع المحتويات", "دعم فني"]'::jsonb),
            ('شهرين', 400, 60, 'باقة شهرين', '["وصول كامل", "جميع المحتويات", "دعم فني", "شهادة معتمدة"]'::jsonb),
            ('3 شهور', 500, 90, 'باقة 3 شهور', '["وصول كامل", "جميع المحتويات", "دعم فني", "شهادة معتمدة", "مراجعات خاصة"]'::jsonb),
            ('5 شهور', 900, 150, 'باقة 5 شهور', '["وصول كامل", "جميع المحتويات", "دعم فني", "شهادة معتمدة", "مراجعات خاصة", "مذكرات"]'::jsonb);
    END IF;
END $$;

-- إضافة بيانات افتراضية لإعدادات الموقع
INSERT INTO public.site_settings (settings)
VALUES (
  '{
    "hero_title": "مرحباً بك في منصة أحمد محرم",
    "hero_description": "منصة تعليمية رائدة تضم أكثر من 50,000 طالب نقدم لك أفضل تجربة تعليمية بمعايير عالمية",
    "total_students": "50,000",
    "total_courses": "500+",
    "success_rate": "98%",
    "active_students": "50K+",
    "total_teachers": "50+",
    "happy_students": "10,000+",
    "available_lessons": "500+",
    "phone_number": "01005209667",
    "whatsapp_number": "201005209667",
    "facebook_url": "#",
    "twitter_url": "#",
    "instagram_url": "#",
    "youtube_url": "#"
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- إعادة تحميل ذاكرة التخزين المؤقت للمخطط
SELECT pg_reload_conf();





حل المشكله ue-700","created_at":"2025-11-17T00:19:55.915598+00:00","updated_at":"2025-11-17T00:19:55.915598+00:00"}]}
PackageManager.tsx:77 Fetched packages data: {success: true, packages: Array(4)}
PackageManager.tsx:80 Setting 4 packages to state
PackageManager.tsx:124 Saving package with data: {name: 'الباقه المميزه علشان خاطر عيونكم', price: 100, daysCount: 30, discountFrom: 200, isDefault: true, …}
PackageManager.tsx:128 Setting up database before saving...
PackageManager.tsx:159 Prepared package data for saving: {name: 'الباقه المميزه علشان خاطر عيونكم', price: 100, daysCount: 30, discountFrom: 200, isDefault: true, …}
PackageManager.tsx:169  POST http://localhost:3000/api/admin/packages 500 (Internal Server Error)
savePackage @ PackageManager.tsx:169
await in savePackage
callCallback @ react-dom.development.js:20458
invokeGuardedCallbackImpl @ react-dom.development.js:20507
invokeGuardedCallback @ react-dom.development.js:20582
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:20596
executeDispatch @ react-dom.development.js:31933
processDispatchQueueItemsInOrder @ react-dom.development.js:31965
processDispatchQueue @ react-dom.development.js:31978
dispatchEventsForPlugins @ react-dom.development.js:31989
eval @ react-dom.development.js:32179
batchedUpdates$1 @ react-dom.development.js:24790
batchedUpdates @ react-dom.development.js:28650
dispatchEventForPluginEventSystem @ react-dom.development.js:32178
dispatchEvent @ react-dom.development.js:29946
dispatchDiscreteEvent @ react-dom.development.js:29917Understand this error
PackageManager.tsx:201 Raw API response: {"error":"Could not find the 'days_count' column of 'packages' in the schema cache"}
PackageManager.tsx:244 API error: {error: "Could not find the 'days_count' column of 'packages' in the schema cache"}
window.console.error @ app-index.js:34
console.error @ hydration-error-info.js:41
savePackage @ PackageManager.tsx:244
await in savePackage
callCallback @ react-dom.development.js:20458
invokeGuardedCallbackImpl @ react-dom.development.js:20507
invokeGuardedCallback @ react-dom.development.js:20582
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:20596
executeDispatch @ react-dom.development.js:31933
processDispatchQueueItemsInOrder @ react-dom.development.js:31965
processDispatchQueue @ react-dom.development.js:31978
dispatchEventsForPlugins @ react-dom.development.js:31989
eval @ react-dom.development.js:32179
batchedUpdates$1 @ react-dom.development.js:24790
batchedUpdates @ react-dom.development.js:28650
dispatchEventForPluginEventSystem @ react-dom.development.js:32178
dispatchEvent @ react-dom.development.js:29946
dispatchDiscreteEvent @ react-dom.development.js:29917Understand this error
PackageManager.tsx:245 Package data that failed: {name: 'الباقه المميزه علشان خاطر عيونكم', price: 100, daysCount: 30, discountFrom: 200, isDefault: true, …}
window.console.error @ app-index.js:34
console.error @ hydration-error-info.js:41
savePackage @ PackageManager.tsx:245
await in savePackage
callCallback @ react-dom.development.js:20458
invokeGuardedCallbackImpl @ react-dom.development.js:20507
invokeGuardedCallback @ react-dom.development.js:20582
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:20596
executeDispatch @ react-dom.development.js:31933
processDispatchQueueItemsInOrder @ react-dom.development.js:31965
processDispatchQueue @ react-dom.development.js:31978
dispatchEventsForPlugins @ react-dom.development.js:31989
eval @ react-dom.development.js:32179
batchedUpdates$1 @ react-dom.development.js:24790
batchedUpdates @ react-dom.development.js:28650
dispatchEventForPluginEventSystem @ react-dom.development.js:32178
dispatchEvent @ react-dom.development.js:29946
dispatchDiscreteEvent @ react-dom.development.js:29917Understand this error
PackageManager.tsx:246 Response status: 500
window.console.error @ app-index.js:34
console.error @ hydration-error-info.js:41
savePackage @ PackageManager.tsx:246
await in savePackage
callCallback @ react-dom.development.js:20458
invokeGuardedCallbackImpl @ react-dom.development.js:20507
invokeGuardedCallback @ react-dom.development.js:20582
invokeGuardedCallbackAndCatchFirstError @ react-dom.development.js:20596
executeDispatch @ react-dom.development.js:31933
processDispatchQueueItemsInOrder @ react-dom.development.js:31965
processDispatchQueue @ react-dom.development.js:31978
dispatchEventsForPlugins @ react-dom.development.js:31989
eval @ react-dom.development.js:32179
batchedUpdates$1 @ react-dom.development.js:24790
batchedUpdates @ react-dom.development.js:28650
dispatchEventForPluginEventSystem @ react-dom.development.js:32178
dispatchEvent @ react-dom.development.js:29946
dispatchDiscreteEvent @ react-dom.development.js:29917Understand this error


POST: Does packages table exist? true
Inserting new package with ID: 0cszu0p
Package data to insert: {
  id: '0cszu0p',
  name: 'الباقه المميزه علشان خاطر عيونكم',
  price: 100,
  days_count: 30,
  discount_from: 200,
  is_default: true,
  color: 'from-amber-600/90 to-black',
  created_at: '2025-11-18T01:43:37.057Z',
  updated_at: '2025-11-18T01:43:37.057Z'
}
Error inserting package: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'days_count' column of 'packages' in the schema cache"
}
Error inserting package: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'days_count' column of 'packages' in the schema cache"
}
Package API error: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'days_count' column of 'packages' in the schema cache"
}
