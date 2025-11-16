-- إصلاح Row Level Security للسماح بالتسجيل

-- تعطيل RLS مؤقتاً لجدول users للسماح بالتسجيل
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- أو يمكنك استخدام هذه السياسات البديلة:
-- ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- السماح للجميع بإنشاء حساب جديد
CREATE POLICY "Enable insert for authentication" ON users
  FOR INSERT WITH CHECK (true);

-- السماح للمستخدمين برؤية بياناتهم
CREATE POLICY "Enable read access for users" ON users
  FOR SELECT USING (
    auth.uid() = id OR 
    role = 'admin'
  );

-- السماح للمستخدمين بتحديث بياناتهم
CREATE POLICY "Enable update for users" ON users
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- السماح للأدمن بحذف المستخدمين
CREATE POLICY "Enable delete for admin" ON users
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- تعطيل RLS للجداول الأخرى مؤقتاً
ALTER TABLE subjects DISABLE ROW LEVEL SECURITY;
ALTER TABLE lectures DISABLE ROW LEVEL SECURITY;
ALTER TABLE lecture_content DISABLE ROW LEVEL SECURITY;
ALTER TABLE views DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE payments DISABLE ROW LEVEL SECURITY;
ALTER TABLE exam_results DISABLE ROW LEVEL SECURITY;
ALTER TABLE exams DISABLE ROW LEVEL SECURITY;
ALTER TABLE questions DISABLE ROW LEVEL SECURITY;
ALTER TABLE device_tracking DISABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs DISABLE ROW LEVEL SECURITY;

-- إدراج حساب الأدمن إذا لم يكن موجوداً
INSERT INTO users (
  email, 
  full_name, 
  phone_number, 
  role, 
  status, 
  subscription_status
)
VALUES (
  'admin@education.com', 
  'أحمد محرم', 
  '01005209667', 
  'admin', 
  'approved', 
  'active'
)
ON CONFLICT (email) DO UPDATE SET
  role = 'admin',
  status = 'approved',
  subscription_status = 'active';

-- إضافة بعض المواد التجريبية
INSERT INTO subjects (title, description, icon, color, is_active, is_premium, order_index)
VALUES 
  ('علم التشريح - Anatomy', 'دراسة تركيب جسم الإنسان وأجهزته المختلفة', '🧬', 'from-blue-500 to-purple-600', true, false, 1),
  ('علم وظائف الأعضاء - Physiology', 'دراسة وظائف أعضاء وأجهزة الجسم', '🫀', 'from-red-500 to-pink-600', true, true, 2),
  ('الكيمياء الحيوية - Biochemistry', 'دراسة التفاعلات الكيميائية في الكائنات الحية', '🧪', 'from-green-500 to-teal-600', true, true, 3),
  ('علم الأمراض - Pathology', 'دراسة الأمراض وأسبابها وتأثيراتها', '🔬', 'from-yellow-500 to-orange-600', true, false, 4)
ON CONFLICT DO NOTHING;
