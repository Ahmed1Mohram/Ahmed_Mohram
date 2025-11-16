const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function checkUsers() {
  try {
    console.log('🔍 جلب جميع المستخدمين من قاعدة البيانات...')
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      console.error('❌ خطأ في جلب المستخدمين:', error)
      return
    }

    if (!users || users.length === 0) {
      console.log('⚠️ لا يوجد مستخدمون في قاعدة البيانات')
      return
    }

    console.log(`✅ تم العثور على ${users.length} مستخدم`)
    console.log('\n📋 آخر المستخدمين المضافين:')
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.full_name}`)
      console.log(`   - ID: ${user.id}`)
      console.log(`   - Email: ${user.email}`)
      console.log(`   - Phone: ${user.phone_number}`)
      console.log(`   - Status: ${user.status}`)
      console.log(`   - Role: ${user.role}`)
      console.log(`   - Created: ${new Date(user.created_at).toLocaleString('ar-EG')}`)
    })

    // عد المستخدمين حسب الحالة
    const pendingCount = users.filter(u => u.status === 'pending').length
    const approvedCount = users.filter(u => u.status === 'approved').length
    const rejectedCount = users.filter(u => u.status === 'rejected').length

    console.log('\n📊 إحصائيات:')
    console.log(`   - معلق: ${pendingCount}`)
    console.log(`   - مقبول: ${approvedCount}`)
    console.log(`   - مرفوض: ${rejectedCount}`)

  } catch (error) {
    console.error('❌ خطأ عام:', error)
  }
}

checkUsers()
