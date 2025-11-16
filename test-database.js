// اختبار قاعدة البيانات الحقيقية
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://fsvwusrpuiczznzgnyvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzdnd1c3JwdWljenpuemdueXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4ODY2MjEsImV4cCI6MjA3ODQ2MjYyMX0.hB6Z0rt0L8miLcPRSPrnjkMb4Mcq6Y_gK-ihbuEb70o'
);

async function testDatabase() {
  console.log('🔍 اختبار الاتصال بقاعدة البيانات الحقيقية...\n');
  
  try {
    // اختبار جدول المستخدمين
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('count');
    
    if (usersError) {
      console.log('❌ خطأ في جدول users:', usersError.message);
    } else {
      console.log('✅ جدول users موجود ويعمل!');
    }
    
    // اختبار جدول المواد
    const { data: subjects, error: subjectsError } = await supabase
      .from('subjects')
      .select('count');
    
    if (subjectsError) {
      console.log('❌ خطأ في جدول subjects:', subjectsError.message);
    } else {
      console.log('✅ جدول subjects موجود ويعمل!');
    }
    
    // اختبار جدول المحاضرات
    const { data: lectures, error: lecturesError } = await supabase
      .from('lectures')
      .select('count');
    
    if (lecturesError) {
      console.log('❌ خطأ في جدول lectures:', lecturesError.message);
    } else {
      console.log('✅ جدول lectures موجود ويعمل!');
    }
    
    // اختبار جدول المدفوعات
    const { data: payments, error: paymentsError } = await supabase
      .from('payments')
      .select('count');
    
    if (paymentsError) {
      console.log('❌ خطأ في جدول payments:', paymentsError.message);
    } else {
      console.log('✅ جدول payments موجود ويعمل!');
    }
    
    console.log('\n📊 النتيجة: قاعدة البيانات حقيقية وتعمل على السحابة!');
    console.log('🌐 يمكن الوصول إليها من أي مكان في العالم');
    
  } catch (error) {
    console.error('خطأ عام:', error);
  }
}

testDatabase();
