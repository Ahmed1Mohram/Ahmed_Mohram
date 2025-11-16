-- إنشاء جدول إعدادات الموقع
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settings JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- إضافة البيانات الافتراضية
INSERT INTO site_settings (settings, created_at, updated_at)
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
  }'::jsonb,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- إنشاء index للبحث السريع
CREATE INDEX IF NOT EXISTS idx_site_settings_updated_at ON site_settings(updated_at DESC);

-- تعليق على الجدول
COMMENT ON TABLE site_settings IS 'جدول إعدادات محتوى الصفحة الرئيسية';
COMMENT ON COLUMN site_settings.settings IS 'JSON يحتوي على جميع إعدادات الصفحة الرئيسية';
