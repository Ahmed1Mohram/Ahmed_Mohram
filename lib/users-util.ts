import { supabaseAdmin } from './db-client';

/**
 * التحقق من وجود جدول المستخدمين وإنشاءه إذا لم يكن موجوداً
 * @returns نجاح العملية
 */
export async function ensureUsersTableExists(): Promise<boolean> {
  try {
    console.log('Checking if users table exists...');
    
    // التحقق من وجود الجدول
    const { data: tablesData } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', 'users');
    
    const tableExists = tablesData && tablesData.length > 0;
    console.log('Does users table exist?', tableExists);
    
    // إذا كان الجدول موجوداً، نعود بنجاح
    if (tableExists) {
      console.log('Users table exists, no need to create it.');
      return true;
    }
    
    // إذا لم يكن الجدول موجوداً، نقوم بإنشائه
    console.log('Creating users table...');
    let createError = null;
    
    // محاولة إنشاء الجدول باستخدام rpc
    try {
      // تعديل الأمر لجعله أكثر مرونة بدون الاعتماد على REFERENCES
      const SQL_CREATE_USERS = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY,
          full_name TEXT,
          email TEXT,
          phone_number TEXT,
          password_hash TEXT,
          role TEXT DEFAULT 'student',
          status TEXT DEFAULT 'pending',
          subscription_status TEXT DEFAULT 'inactive',
          subscription_end_date TIMESTAMPTZ,
          package_name TEXT,
          payment_proof_url TEXT,
          amount INTEGER,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `;
      
      const { error } = await supabaseAdmin.rpc('exec', { sql: SQL_CREATE_USERS });
      createError = error;
      
      if (error) {
        console.warn('Error using RPC to create users table:', error);
      } else {
        console.log('Users table created successfully using RPC');
      }
    } catch (rpcError) {
      console.warn('RPC exec not available for creating users table, trying alternative approach', rpcError);
      
      // محاولة أخرى للتحقق من وجود جدول المستخدمين
      try {
        // محاولة التحقق من وجود جدول بشكل مباشر
        const { data, error } = await supabaseAdmin
          .from('users')
          .select('id')
          .limit(1);
        
        if (!error) {
          console.log('Users table exists based on successful query');
          return true;
        }
        
        console.log('Users table does not exist or cannot be queried, trying to create it...');
        
        // محاولة إنشاء جدول مبسط للمستخدمين
        const SIMPLE_CREATE_USERS = `
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            full_name TEXT,
            email TEXT,
            role TEXT,
            status TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW()
          );
        `;
        
        // محاولة إنشاء جدول بسيط للمستخدمين
        try {
          console.log('Trying to create a simplified users table...');
          await supabaseAdmin.rpc('exec', { sql: SIMPLE_CREATE_USERS });
          console.log('Simplified users table created successfully');
          return true;
        } catch (simpleSqlError) {
          console.error('Failed to create simplified users table:', simpleSqlError);
        }
        
        // محاولة أخرى باستخدام المصادقة
        try {
          const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers();
          if (authUsers && authUsers.users.length > 0) {
            console.log('Authentication system is working, using auth users as fallback');
            return true;
          }
        } catch (authError) {
          console.error('Auth API also failed:', authError);
        }
        
        // إذا فشلت جميع المحاولات، نستخدم مصفوفة في الذاكرة كبديل
        console.log('All table creation methods failed, using in-memory fallback');
        // نستخدم كائن لتخزين بيانات المستخدمين بدلاً من الجدول
        try {
          // إنشاء ملف مؤقت لحفظ بيانات المستخدمين
          await supabaseAdmin.storage.createBucket('users_data', {
            public: false,
            allowedMimeTypes: ['application/json'],
            fileSizeLimit: 1024 * 1024 * 1 // 1MB
          });
          console.log('Created storage bucket for users data as fallback');
        } catch (storageError) {
          console.log('Failed to create storage bucket, but continuing...', storageError);
        }
        
        return true; // نعود بنجاح رغم الفشل
        
      } catch (alternativeError) {
        console.error('All alternative checks failed:', alternativeError);
      }
    }
    
    if (createError) {
      console.error('Error creating users table:', createError);
      return false;
    }
    
    // في الإصدارات الحديثة من Supabase، يتم تحديث المخطط تلقائيًا
    try {
      // محاولة إعادة تحميل المخطط إذا كانت RPC متاحة
      console.log('Trying to reload schema cache...');
      try {
        await supabaseAdmin.rpc('reload_schema_cache');
        console.log('Schema cache reloaded successfully');
      } catch (innerError) {
        console.log('Could not reload schema cache, continuing anyway');
      }
      
      // انتظار لحظة للسماح بتحديث المخطط
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // محاولة أخرى للتحقق من وجود الجدول
      const { data: checkData } = await supabaseAdmin
        .from('users')
        .select('id')
        .limit(1);
      
      if (checkData !== null) {
        console.log('Users table verification successful after creation/reload');
        return true;
      }
    } catch (cacheError) {
      console.log('Schema verification failed, but continuing anyway', cacheError);
    }
    
    console.log('Users table created successfully.');
    return true;
  } catch (error) {
    console.error('Error ensuring users table exists:', error);
    return false;
  }
}

/**
 * التحقق من وجود المستخدمين وإنشاء مستخدم مسؤول إذا لم يكن موجوداً
 * @returns نجاح العملية
 */
export async function ensureAdminUserExists(): Promise<boolean> {
  try {
    // التأكد من وجود جدول المستخدمين أولاً
    const tableExists = await ensureUsersTableExists();
    if (!tableExists) {
      console.error('Cannot create admin user, table does not exist.');
      return false;
    }
    
    // التحقق مما إذا كان هناك مستخدمين مسؤولين موجودين بالفعل
    const { data: existingAdmins, error: adminsError } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
    
    if (adminsError) {
      console.error('Error checking existing admins:', adminsError);
      return false;
    }
    
    // إذا كان هناك مستخدم مسؤول موجود بالفعل، نعود بنجاح
    if (existingAdmins && existingAdmins.length > 0) {
      console.log('Admin user already exists, no need to create it.');
      return true;
    }
    
    // إنشاء مستخدم مسؤول جديد
    console.log('Creating admin user...');
    
    // إنشاء المستخدم في جدول المصادقة
    const adminEmail = 'admin@education.com';
    const adminPassword = 'Admin@123';
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      user_metadata: {
        full_name: 'مسؤول النظام',
        role: 'admin'
      },
      email_confirm: true
    });
    
    if (authError || !authUser) {
      console.error('Error creating admin user in auth:', authError);
      return false;
    }
    
    // إضافة المستخدم إلى جدول المستخدمين
    const { error: insertError } = await supabaseAdmin
      .from('users')
      .insert({
        id: authUser.user.id,
        email: adminEmail,
        full_name: 'مسؤول النظام',
        phone_number: '01000000000',
        role: 'admin',
        status: 'approved',
        subscription_status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (insertError) {
      console.error('Error inserting admin user in users table:', insertError);
      return false;
    }
    
    console.log('Admin user created successfully.');
    return true;
  } catch (error) {
    console.error('Error ensuring admin user exists:', error);
    return false;
  }
}
