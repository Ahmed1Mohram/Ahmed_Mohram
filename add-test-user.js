// إضافة مستخدم تجريبي حقيقي في قاعدة البيانات
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fsvwusrpuiczznzgnyvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdnd1c3JwdWljenpuemdueXZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg4NjYyMSwiZXhwIjoyMDc4NDYyNjIxfQ.nNVpkQodQkZ5RULi1R7yLHizr2ig58FbCNV6VBrxwc4'
);

async function addTestUser() {
  console.log('🚀 إضافة مستخدم تجريبي حقيقي...\n');
  
  const testUser = {
    email: 'test@gmail.com',
    full_name: 'طالب تجريبي',
    phone_number: '01234567890',
    status: 'pending',
    role: 'student',
    subscription_status: 'inactive'
  };
  
  const { data, error } = await supabase
    .from('users')
    .insert(testUser)
    .select();
  
  if (error) {
    console.log('❌ خطأ:', error.message);
  } else {
    console.log('✅ تم إضافة المستخدم بنجاح!');
    console.log('📝 البيانات المحفوظة:', data);
    console.log('\n🌐 هذا المستخدم محفوظ الآن في قاعدة البيانات السحابية');
    console.log('👀 يمكنك رؤيته في لوحة الأدمن من أي مكان!');
  }
}

addTestUser();
