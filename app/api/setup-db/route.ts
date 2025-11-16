import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db-client';
import { ensurePackagesTableExists, insertDefaultPackagesIfNeeded } from '@/lib/packages-util';
import { createSubscriptionsTable, createUpdateTimestampFunction } from '../admin/subscriptions/create-tables';
import { ensureUsersTableExists, ensureAdminUserExists } from '@/lib/users-util';

export async function GET(req: NextRequest) {
  try {
    console.log('Setting up database tables...');
    
    // تهيئة جدول الباقات
    const packagesTableCreated = await ensurePackagesTableExists();
    console.log('Packages table created/exists:', packagesTableCreated);
    
    // إدخال الباقات الافتراضية
    if (packagesTableCreated) {
      const packagesInserted = await insertDefaultPackagesIfNeeded();
      console.log('Default packages inserted:', packagesInserted);
    }
    
    // تهيئة جدول المستخدمين
    const usersTableCreated = await ensureUsersTableExists();
    console.log('Users table created/exists:', usersTableCreated);
    
    // إنشاء مستخدم إدارة افتراضي
    if (usersTableCreated) {
      const adminCreated = await ensureAdminUserExists();
      console.log('Admin user created/exists:', adminCreated);
    }
    
    // تهيئة جدول الاشتراكات
    const subscriptionsTableCreated = await createSubscriptionsTable();
    console.log('Subscriptions table created:', subscriptionsTableCreated);
    
    // إنشاء دالة الطابع الزمني
    const timestampFunctionCreated = await createUpdateTimestampFunction();
    console.log('Timestamp function created:', timestampFunctionCreated);
    
    // محاولة إعادة تحميل ذاكرة المخطط
    try {
      await supabaseAdmin.rpc('reload_schema_cache');
      console.log('Schema cache reloaded successfully');
    } catch (cacheError) {
      console.log('Schema cache reload failed, continuing anyway');
    }
    
    // تحقق من إنشاء الجداول
    try {
      // تحقق من جدول الباقات
      const { data: packagesData, error: packagesError } = await supabaseAdmin
        .from('packages')
        .select('count');
      
      console.log('Packages table data:', packagesData, 'Error:', packagesError);
      
      // تحقق من جدول الاشتراكات
      const { data: subscriptionsData, error: subscriptionsError } = await supabaseAdmin
        .from('subscriptions')
        .select('count');
      
      console.log('Subscriptions table data:', subscriptionsData, 'Error:', subscriptionsError);
      
      // إعادة تحميل ذاكرة المخطط مرة أخرى
      await new Promise(resolve => setTimeout(resolve, 1000));
      await supabaseAdmin.rpc('reload_schema_cache');
    } catch (e) {
      console.error('Error checking tables:', e);
    }
    
    return NextResponse.json({
      success: true,
      message: 'تم تهيئة قاعدة البيانات بنجاح'
    });
  } catch (error: any) {
    console.error('Error setting up database:', error);
    return NextResponse.json(
      { error: error.message || 'حدث خطأ في تهيئة قاعدة البيانات' },
      { status: 500 }
    );
  }
}