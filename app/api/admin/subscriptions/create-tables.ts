import { supabaseAdmin } from '@/lib/db-client'

/**
 * وظيفة تقوم بإنشاء جدول الاشتراكات إذا لم يكن موجوداً
 */
export async function createSubscriptionsTable() {
  try {
    // محاولة إنشاء الجدول باستخدام SQL مباشر
    const { error } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS subscriptions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL,
          package_id TEXT NOT NULL,
          package_name TEXT NOT NULL,
          start_date TIMESTAMPTZ DEFAULT NOW(),
          expiry_date TIMESTAMPTZ NOT NULL,
          price INTEGER NOT NULL,
          days_count INTEGER NOT NULL,
          payment_method TEXT,
          transaction_id TEXT,
          status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.error('Error creating subscriptions table:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception creating subscriptions table:', error);
    return false;
  }
}

/**
 * وظيفة تقوم بإنشاء جدول الباقات إذا لم يكن موجوداً
 */
export async function createPackagesTable() {
  try {
    // محاولة إنشاء الجدول باستخدام SQL مباشر
    const { error } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS packages (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          price INTEGER NOT NULL,
          days_count INTEGER NOT NULL,
          discount_from INTEGER,
          color TEXT,
          is_default BOOLEAN DEFAULT false,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    });

    if (error) {
      console.error('Error creating packages table:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception creating packages table:', error);
    return false;
  }
}

/**
 * إنشاء وظيفة SQL لتحديث وقت التعديل عند تحديث البيانات
 */
export async function createUpdateTimestampFunction() {
  try {
    const { error } = await supabaseAdmin.rpc('exec', {
      sql: `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ language 'plpgsql';

        -- تطبيق الدالة على جدول الباقات
        DROP TRIGGER IF EXISTS update_packages_updated_at ON packages;
        CREATE TRIGGER update_packages_updated_at BEFORE UPDATE ON packages
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

        -- تطبيق الدالة على جدول الاشتراكات
        DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;
        CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
          FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
      `
    });

    if (error) {
      console.error('Error creating timestamp function:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception creating timestamp function:', error);
    return false;
  }
}
