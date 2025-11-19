import { supabaseAdmin } from './db-client';

/**
 * التحقق من وجود جدول الباقات وإنشاءه إذا لم يكن موجوداً
 * @returns نجاح العملية
 */
export async function ensurePackagesTableExists(): Promise<boolean> {
  try {
    console.log('Checking if packages table exists...');
    
    // التحقق من وجود الجدول
    const { data: tablesData } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', 'packages');
    
    const tableExists = tablesData && tablesData.length > 0;
    console.log('Does packages table exist?', tableExists);
    
    // إذا لم يكن الجدول موجوداً، نقوم بإنشائه
    console.log('Creating packages table if needed...');
    let createError = null;
    
    if (!tableExists) {
      console.log('Creating packages table...');
      
      // محاولة إنشاء الجدول باستخدام rpc
      try {
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
        createError = error;
      } catch (rpcError) {
        console.warn('RPC exec not available, trying alternative approach', rpcError);
        
        // محاولة أخرى للتحقق من وجود جدول الباقات
        try {
          const { data, error } = await supabaseAdmin
            .from('packages')
            .select('id')
            .limit(1);
          
          if (!error) {
            // إذا نجحت عملية الاستعلام، فهذا يعني أن الجدول موجود
            console.log('Table exists based on successful query');
            createError = null;
          }
        } catch (queryError) {
          console.error('Alternative check failed too:', queryError);
        }
      }
    }
    
    if (createError) {
      console.error('Error creating packages table:', createError);
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
        .from('packages')
        .select('id')
        .limit(1);
      
      if (checkData !== null) {
        console.log('Table verification successful after creation/reload');
      }
    } catch (cacheError) {
      console.log('Schema verification failed, but continuing anyway', cacheError);
    }

    // التأكد من وجود الأعمدة المطلوبة في جدول الباقات
    try {
      console.log('Ensuring required columns exist on packages table...');
      const { error: alterError } = await supabaseAdmin.rpc('exec', {
        sql: `
          ALTER TABLE packages ADD COLUMN IF NOT EXISTS days_count INTEGER;
          ALTER TABLE packages ADD COLUMN IF NOT EXISTS duration_days INTEGER;
          ALTER TABLE packages ADD COLUMN IF NOT EXISTS discount_from INTEGER;
          ALTER TABLE packages ADD COLUMN IF NOT EXISTS color TEXT;
          ALTER TABLE packages ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;
          ALTER TABLE packages ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
          ALTER TABLE packages ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
        `
      });

      if (alterError) {
        console.error('Error ensuring packages table columns:', alterError);
      }
    } catch (alterException) {
      console.error('Exception while ensuring packages table columns:', alterException);
    }

    // محاولة إعادة تحميل المخطط بعد تعديل الأعمدة
    try {
      console.log('Reloading schema cache after ensuring columns...');
      await supabaseAdmin.rpc('reload_schema_cache');
      console.log('Schema cache reloaded successfully after altering columns');
    } catch (reloadColumnsError) {
      console.log('Could not reload schema cache after altering columns', reloadColumnsError);
    }

    console.log('Packages table verified with required columns.');
    return true;
  } catch (error) {
    console.error('Error ensuring packages table exists:', error);
    return false;
  }
}

/**
 * إدخال الباقات الافتراضية إذا كان الجدول فارغاً
 * @returns نجاح العملية
 */
export async function insertDefaultPackagesIfNeeded(): Promise<boolean> {
  try {
    // التأكد من وجود جدول الباقات أولاً
    const tableExists = await ensurePackagesTableExists();
    if (!tableExists) {
      console.error('Cannot insert default packages, table does not exist.');
      return false;
    }
    
    // التحقق مما إذا كانت هناك باقات موجودة بالفعل
    const { data: existingPackages, error: countError } = await supabaseAdmin
      .from('packages')
      .select('id')
      .limit(1);
    
    if (countError) {
      console.error('Error checking existing packages:', countError);
      return false;
    }
    
    // إذا كانت هناك باقات موجودة بالفعل، نعود بنجاح
    if (existingPackages && existingPackages.length > 0) {
      console.log('Packages already exist, no need to insert defaults.');
      return true;
    }
    
    // الباقات الافتراضية
    const defaultPackages = [
      { id: '1', name: 'باقة الشهر الواحد', price: 200, days_count: 30, is_default: true, color: 'from-gold to-amber-600' },
      { id: '2', name: 'باقة الشهرين', price: 400, days_count: 60, is_default: false, color: 'from-blue-500 to-indigo-700' },
      { id: '3', name: 'باقة 3 شهور', price: 500, days_count: 90, is_default: false, color: 'from-purple-500 to-purple-800' },
      { id: '4', name: 'باقة 5 شهور', price: 900, days_count: 150, is_default: false, color: 'from-red-500 to-rose-800' },
      { id: '5', name: 'العرض المميز', price: 100, days_count: 30, discount_from: 200, is_default: false, color: 'from-green-500 to-emerald-700' }
    ];
    
    console.log('Inserting default packages...');
    
    // إدخال الباقات الافتراضية
    const { error: insertError } = await supabaseAdmin
      .from('packages')
      .insert(defaultPackages.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        days_count: pkg.days_count,
        discount_from: pkg.discount_from || null,
        color: pkg.color || null,
        is_default: pkg.is_default || false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));
    
    if (insertError) {
      console.error('Error inserting default packages:', insertError);
      return false;
    }
    
    console.log('Default packages inserted successfully.');
    return true;
  } catch (error) {
    console.error('Error inserting default packages:', error);
    return false;
  }
}
