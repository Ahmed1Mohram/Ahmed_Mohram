import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
import { ensureUsersTableExists, ensureAdminUserExists } from '@/lib/users-util'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    console.log('Fetching all users from admin API...')
    
    // التأكد من وجود جدول المستخدمين وإنشائه إذا لم يكن موجوداً
    const tableExists = await ensureUsersTableExists();
    
    // حتى لو فشلنا في إنشاء الجدول، نمضي قدماً ونحاول أولاً استخدام المصادقة
    if (!tableExists) {
      console.log('Using authentication system as a fallback for users...');
    }
    
    // التأكد من وجود مستخدم مسؤول
    const adminExists = await ensureAdminUserExists();
    
    console.log('Database setup complete, fetching users...');
    
    // Fetch all users without RLS restriction
    const { data: users, error, count } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users from database table:', error)
      
      // محاولة باستخدام واجهة المصادقة
      try {
        console.log('Trying auth API as a fallback...')
        const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
        console.log('Fetched users from auth API:', authUsers ? `${authUsers.users.length} users` : 'No data')
        
        if (authUsers?.users?.length) {
          // قم بإرجاع بيانات المستخدمين من واجهة المصادقة
          const authUsersList = authUsers.users.map(user => ({
            id: user.id,
            email: user.email || '',
            phone_number: user.phone || '',
            full_name: user.user_metadata?.full_name || user.email || '',
            status: 'approved',
            subscription_status: 'inactive',
            role: user.email?.includes('admin') ? 'admin' : 'student',
            created_at: user.created_at,
            updated_at: user.updated_at || user.last_sign_in_at || user.created_at
          }))
          
          return NextResponse.json({
            success: true,
            users: authUsersList,
            count: authUsersList.length,
            source: 'auth.admin.listUsers'
          })
        }
      } catch (authError) {
        console.error('Error fetching users from auth API:', authError)
      }

      // إذا فشلت كل المحاولات (أو المفتاح غير صالح)، لا نكسر لوحة الأدمن
      // نرجع قائمة فارغة بدلاً من 500 حتى تستمر الواجهة في العمل
      return NextResponse.json({
        success: true,
        users: [],
        count: 0,
        source: 'fallback-empty',
        error: error.message
      })
    }

    console.log(`Found ${count || 0} users from database`);
    console.log('Sample user data (first user):', users && users.length > 0 ? JSON.stringify(users[0]) : 'No users found');
    
    // Ensure all fields are included
    const formattedUsers = (users || []).map(user => {
      const formattedUser = {
        ...user,
        id: user.id,
        full_name: user.full_name || '',
        email: user.email || '',
        phone_number: user.phone_number || '',
        status: user.status || 'pending',
        subscription_status: user.subscription_status || 'inactive',
        role: user.role || 'student',
        created_at: user.created_at || new Date().toISOString()
      };
      return formattedUser;
    });
    
    // تأكد من أنه تم تنسيق المستخدمين بشكل صحيح
    console.log('Formatted users count:', formattedUsers.length);
    console.log('Sample formatted user:', formattedUsers.length > 0 ? JSON.stringify(formattedUsers[0]) : 'No users')

    return NextResponse.json({
      success: true,
      users: formattedUsers,
      count: count || 0
    })
  } catch (error: any) {
    console.error('API error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error.message || 'Unknown error',
      stack: error.stack 
    }, { status: 500 })
  }
}
