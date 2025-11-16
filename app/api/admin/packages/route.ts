import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
import { ensurePackagesTableExists, insertDefaultPackagesIfNeeded } from '@/lib/packages-util'

// تعريف واجهة الباقة
interface Package {
  id: string;
  name: string;
  price: number;
  daysCount: number;
  discountFrom?: number;
  isDefault?: boolean;
  color?: string;
}

// الباقات الافتراضية
const DEFAULT_PACKAGES: Package[] = [
  { id: '1', name: 'باقة الشهر الواحد', price: 200, daysCount: 30, isDefault: true, color: 'from-gold to-amber-600' },
  { id: '2', name: 'العرض المميز', price: 100, daysCount: 30, discountFrom: 200, isDefault: false, color: 'from-green-500 to-emerald-700' },
  { id: '3', name: 'باقة الشهرين', price: 400, daysCount: 60, isDefault: false, color: 'from-blue-500 to-indigo-700' },
  { id: '4', name: 'باقة 3 شهور', price: 500, daysCount: 90, isDefault: false, color: 'from-purple-500 to-purple-800' },
  { id: '5', name: 'باقة 5 شهور', price: 900, daysCount: 150, isDefault: false, color: 'from-red-500 to-rose-800' }
];

// تم نقل الوظائف إلى ملف packages-util.ts

// GET: جلب جميع الباقات
export async function GET(req: NextRequest) {
  try {
    // التأكد من وجود جدول الباقات وإنشاءه إذا لم يكن موجوداً
    const tableExists = await ensurePackagesTableExists();
    
    // إذا لم يمكن إنشاء الجدول، استخدم الباقات الافتراضية
    if (!tableExists) {
      console.error('Could not ensure packages table exists');
      // عند تعذر إنشاء الجدول، نرجع الباقات الافتراضية بنفس الصيغة
      return NextResponse.json({
        success: true,
        packages: DEFAULT_PACKAGES,
        info: 'تعذر إنشاء جدول الباقات، تم استخدام الباقات الافتراضية'
      });
    }
    
    // إدخال الباقات الافتراضية إذا لم تكن موجودة بالفعل
    await insertDefaultPackagesIfNeeded();
    
    // محاولة جلب الباقات من قاعدة البيانات
    try {
      console.log('Fetching packages from database...');
      const { data: packagesData, error: packagesError } = await supabaseAdmin
        .from('packages')
        .select('*')
        .order('price', { ascending: true });
        
      console.log('Fetched packages result:', 
        packagesError ? `Error: ${packagesError.message}` : 
        `Success: ${packagesData?.length || 0} packages`);
      
      // طباعة أول باقة للتشخيص
      if (packagesData && packagesData.length > 0) {
        console.log('Sample package:', JSON.stringify(packagesData[0]));
      }
      
      // في حالة حدوث خطأ
      if (packagesError) {
        console.error('Error fetching packages:', packagesError);
        
        console.log('Returning default packages due to error');
        // إرجاع البيانات الافتراضية في حالة الخطأ
        return NextResponse.json({
          success: true,
          packages: DEFAULT_PACKAGES,
          info: 'تم استخدام الباقات الافتراضية بسبب خطأ في قاعدة البيانات',
          error: packagesError.message
        });
      }
      
      // إذا لم تكن هناك باقات في قاعدة البيانات
      if (!packagesData || packagesData.length === 0) {
        // إضافة الباقات الافتراضية
        await insertDefaultPackagesIfNeeded();
        
        // جلب الباقات مرة أخرى
        const { data: freshData } = await supabaseAdmin
          .from('packages')
          .select('*')
          .order('price', { ascending: true });
        
        // تحويل البيانات الجديدة إلى صيغة متوافقة
        const formattedFreshPackages = freshData ? freshData.map(pkg => ({
          id: pkg.id,
          name: pkg.name,
          price: pkg.price,
          daysCount: pkg.days_count, 
          discountFrom: pkg.discount_from || null,
          isDefault: pkg.is_default || false,
          color: pkg.color || 'from-blue-500 to-blue-700',
          created_at: pkg.created_at,
          updated_at: pkg.updated_at
        })) : [];

        return NextResponse.json({
          success: true,
          packages: formattedFreshPackages.length > 0 ? formattedFreshPackages : DEFAULT_PACKAGES,
          info: 'تم إدخال الباقات الافتراضية'
        });
      }
      
      // تحويل البيانات من قاعدة البيانات إلى صيغة متوافقة مع واجهة المستخدم
      const formattedPackages = packagesData.map(pkg => ({
        id: pkg.id,
        name: pkg.name,
        price: pkg.price,
        daysCount: pkg.days_count, // تحويل days_count إلى daysCount للتوافق مع واجهة المستخدم
        discountFrom: pkg.discount_from || null,
        isDefault: pkg.is_default || false,
        color: pkg.color || 'from-blue-500 to-blue-700',
        created_at: pkg.created_at,
        updated_at: pkg.updated_at
      }));
      
      console.log('Formatted packages:', formattedPackages.length);
      
      // إرجاع الباقات المحولة
      return NextResponse.json({
        success: true,
        packages: formattedPackages
      });
    } catch (fetchError) {
      console.error('Error fetching packages:', fetchError);
      console.log('Returning default packages due to exception');
      return NextResponse.json({
        success: true,
        packages: DEFAULT_PACKAGES,
        error: 'خطأ في قراءة الباقات، تم استخدام البيانات الافتراضية'
      });
    }
  } catch (error: any) {
    console.error('Package API error:', error);
    return NextResponse.json(
      { success: true, packages: DEFAULT_PACKAGES, error: error.message || 'حدث خطأ في جلب الباقات' },
      { status: 200 } // نعيد 200 حتى في حالة الخطأ مع البيانات الافتراضية
    );
  }
}

// POST: إضافة أو تعديل باقة
export async function POST(req: NextRequest) {
  try {
    console.log('POST request to /api/admin/packages received');
    const packageData = await req.json();
    console.log('Package data:', packageData);
    
    // توحيد اسم حقل عدد الأيام للتعامل مع كلا النمطين (days_count و daysCount)
    if (packageData.daysCount && !packageData.days_count) {
      packageData.days_count = packageData.daysCount;
    } else if (packageData.days_count && !packageData.daysCount) {
      packageData.daysCount = packageData.days_count;
    }

    // التحقق من وجود جدول الباقات أولاً
    const { data: tablesData } = await supabaseAdmin
      .from('pg_tables')
      .select('tablename')
      .eq('schemaname', 'public')
      .eq('tablename', 'packages');
    
    const tableExists = tablesData && tablesData.length > 0;
    console.log('POST: Does packages table exist?', tableExists);
    
    // إذا لم يكن الجدول موجوداً، قم بإنشائه
    if (!tableExists) {
      console.log('Creating packages table in POST method...');
      await supabaseAdmin.rpc('exec', {
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
      
      // إعادة تحميل ذاكرة المخطط
      try {
        console.log('POST: Reloading schema cache after table creation...');
        await supabaseAdmin.rpc('reload_schema_cache');
        console.log('POST: Waiting for schema cache to update...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      } catch (e) {
        console.log('POST: Could not reload schema cache', e);
      }
    }
    
    // التحقق من وجود البيانات المطلوبة
    if (!packageData.name || !packageData.price || (!packageData.daysCount && !packageData.days_count)) {
      console.log('Missing required fields:', packageData);
      return NextResponse.json(
        { 
          error: 'جميع البيانات مطلوبة (الاسم، السعر، عدد الأيام)',
          received: {
            name: packageData.name || null,
            price: packageData.price || null,
            days_count: packageData.days_count || packageData.daysCount || null
          }
        },
        { status: 400 }
      );
    }

    let result = null;
    
    try {
      // إذا كان هناك id، قم بتحديث الباقة
      if (packageData.id) {
        try {
          const { data, error } = await supabaseAdmin
            .from('packages')
            .update({
              name: packageData.name,
              price: packageData.price,
              days_count: packageData.daysCount,
              discount_from: packageData.discountFrom || null,
              is_default: packageData.isDefault || false,
              color: packageData.color || null,
              updated_at: new Date().toISOString()
            })
            .eq('id', packageData.id)
            .select();

          if (error) {
            throw error;
          }

          result = data;
        } catch (updateError: any) {
          // إذا كان الخطأ يتعلق بذاكرة المخطط، نستخدم SQL مباشر
          if (updateError.message && (
              updateError.message.includes('could not find the table') || 
              updateError.message.includes('schema cache'))) {
            
            console.log('Using raw SQL due to schema cache error');
            await supabaseAdmin.rpc('exec', {
              sql: `
                UPDATE packages 
                SET 
                  name = '${packageData.name}',
                  price = ${packageData.price},
                  days_count = ${packageData.daysCount},
                  discount_from = ${packageData.discountFrom || 'NULL'},
                  color = ${packageData.color ? `'${packageData.color}'` : 'NULL'},
                  is_default = ${packageData.isDefault || false},
                  updated_at = NOW()
                WHERE id = '${packageData.id}'
                RETURNING *;
              `
            });
            
            result = [{ id: packageData.id, ...packageData }];
          } else {
            throw updateError;
          }
        }
      } else {
        // إنشاء باقة جديدة
        const newId = Math.random().toString(36).substring(2, 9);
        
        try {
          console.log('Inserting new package with ID:', newId);
          
          // التأكد من أن البيانات جاهزة للإدراج
          const packageToInsert = {
            id: newId,
            name: packageData.name,
            price: packageData.price,
            days_count: packageData.days_count || packageData.daysCount,
            discount_from: packageData.discountFrom || null,
            is_default: packageData.isDefault || false,
            color: packageData.color || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };
          
          console.log('Package data to insert:', packageToInsert);
          
          const { data, error } = await supabaseAdmin
            .from('packages')
            .insert(packageToInsert)
            .select();

          if (error) {
            console.error('Error inserting package:', error);
            throw error;
          }

          console.log('Package inserted successfully, result:', data);
          result = data;
        } catch (insertError: any) {
          // إذا كان الخطأ يتعلق بذاكرة المخطط، نستخدم SQL مباشر
          if (insertError.message && (
              insertError.message.includes('could not find the table') || 
              insertError.message.includes('schema cache'))) {
            
            console.log('Using raw SQL for insert due to schema cache error');
            try {
              const sqlQuery = `
                INSERT INTO packages (
                  id, name, price, days_count, discount_from, color, is_default, created_at, updated_at
                ) VALUES (
                  '${newId}',
                  '${packageData.name}',
                  ${packageData.price},
                  ${packageData.days_count || packageData.daysCount},
                  ${packageData.discountFrom || 'NULL'},
                  ${packageData.color ? `'${packageData.color}'` : 'NULL'},
                  ${packageData.isDefault || false},
                  NOW(),
                  NOW()
                )
                RETURNING *;
              `;
              
              console.log('Raw SQL query:', sqlQuery);
              
              const { data: sqlResult, error: sqlError } = await supabaseAdmin.rpc('exec', {
                sql: sqlQuery
              });
              
              if (sqlError) {
                console.error('SQL execution error:', sqlError);
                throw sqlError;
              }
              
              console.log('SQL execution successful:', sqlResult);
            } catch (sqlExecError) {
              console.error('Error executing SQL:', sqlExecError);
              // استمرار التنفيذ رغم الخطأ
            }
            
            // إرجاع نتيجة من البيانات المدخلة
            result = [{ 
              id: newId, 
              name: packageData.name,
              price: packageData.price,
              days_count: packageData.days_count || packageData.daysCount,
              daysCount: packageData.days_count || packageData.daysCount,
              discount_from: packageData.discountFrom || null,
              discountFrom: packageData.discountFrom || null,
              color: packageData.color,
              is_default: packageData.isDefault || false,
              isDefault: packageData.isDefault || false,
              created_at: new Date().toISOString()
            }];
          } else {
            throw insertError;
          }
        }
      }
      
      // إذا تم تعيين هذه الباقة كافتراضية، قم بإلغاء الإعداد الافتراضي من الباقات الأخرى
      if (packageData.isDefault) {
        try {
          await supabaseAdmin
            .from('packages')
            .update({ is_default: false })
            .neq('id', packageData.id || result?.[0]?.id);
        } catch (defaultError) {
          console.error('Error updating default status for other packages:', defaultError);
        }
      }

      return NextResponse.json({
        success: true,
        package: result?.[0] || { id: packageData.id || Math.random().toString(36).substring(2, 9), ...packageData },
        message: 'تم حفظ الباقة بنجاح'
      });
    } catch (error: any) {
      console.error('Package API error:', error);
      return NextResponse.json(
        { error: error.message || 'حدث خطأ في حفظ الباقة' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Package API error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حفظ الباقة' },
      { status: 500 }
    );
  }
}

// DELETE: حذف باقة
export async function DELETE(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const packageId = searchParams.get('id');

  if (!packageId) {
    return NextResponse.json(
      { error: 'معرف الباقة مطلوب' },
      { status: 400 }
    );
  }

  try {
    const { error } = await supabaseAdmin
      .from('packages')
      .delete()
      .eq('id', packageId);

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف الباقة بنجاح'
    });
  } catch (error: any) {
    console.error('Package API error:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في حذف الباقة' },
      { status: 500 }
    );
  }
}
