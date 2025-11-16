import { supabaseAdmin } from '@/lib/db-client'

export async function createUserStatusTable() {
  try {
    // إنشاء جدول حالة المستخدمين إذا لم يكن موجوداً
    const { error: tableError } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS user_status (
          user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
          approval_status TEXT NOT NULL DEFAULT 'pending',
          selected_package_id TEXT,
          selected_package_name TEXT,
          admin_notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        -- إنشاء دالة لتحديث حقل updated_at
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;
        
        -- إنشاء trigger لتحديث حقل updated_at تلقائياً
        DROP TRIGGER IF EXISTS update_user_status_updated_at ON user_status;
        CREATE TRIGGER update_user_status_updated_at
        BEFORE UPDATE ON user_status
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
      `
    });
    
    if (tableError) {
      console.error('Error creating user_status table:', tableError);
      return false;
    }
    
    console.log('User status table created or already exists');
    return true;
  } catch (error) {
    console.error('Exception in createUserStatusTable:', error);
    return false;
  }
}

// إنشاء دالة لإضافة حقول إلى جدول المستخدمين إذا لم تكن موجودة
export async function addUserProfileFields() {
  try {
    const { error: alterError } = await supabaseAdmin.rpc('exec', {
      sql: `
        DO $$
        BEGIN
          -- إضافة حقول إلى جدول المستخدمين إذا لم تكن موجودة
          BEGIN
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending';
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_package_id TEXT;
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_package_name TEXT;
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS device_info JSONB;
            ALTER TABLE public.users ADD COLUMN IF NOT EXISTS admin_notes TEXT;
          EXCEPTION
            WHEN duplicate_column THEN
              RAISE NOTICE 'Column already exists in users table';
          END;
        END$$;
      `
    });
    
    if (alterError) {
      console.error('Error altering users table:', alterError);
      return false;
    }
    
    console.log('User profile fields added or already exist');
    return true;
  } catch (error) {
    console.error('Exception in addUserProfileFields:', error);
    return false;
  }
}