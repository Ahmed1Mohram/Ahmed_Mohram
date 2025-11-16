const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function addTestUser() {
  const testUser = {
    id: crypto.randomUUID(),
    email: `test${Date.now()}@education.com`,
    full_name: 'طالب تجريبي جديد',
    phone_number: `0100${Math.floor(Math.random() * 10000000)}`,
    status: 'pending',
    role: 'student',
    subscription_status: 'inactive',
    created_at: new Date().toISOString()
  }

  console.log('📝 إضافة مستخدم تجريبي:', testUser)

  try {
    const { data, error } = await supabase
      .from('users')
      .insert(testUser)
      .select()
      .single()

    if (error) {
      console.error('❌ خطأ في إضافة المستخدم:', error)
      return
    }

    console.log('✅ تم إضافة المستخدم بنجاح:')
    console.log('   - ID:', data.id)
    console.log('   - الاسم:', data.full_name)
    console.log('   - البريد:', data.email)
    console.log('   - الهاتف:', data.phone_number)
    console.log('   - الحالة:', data.status)
    console.log('\n✨ يجب أن يظهر المستخدم الآن في لوحة الأدمن!')

  } catch (error) {
    console.error('❌ خطأ:', error.message)
  }
}

addTestUser()
