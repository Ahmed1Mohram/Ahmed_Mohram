import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}

async function ensureLectureContentTable() {
  try {
    console.log('التأكد من وجود جدول lecture_content وإنشاءه إن لم يكن موجودًا')
    
    // 1. التحقق أولاً مما إذا كان الجدول موجودًا
    let tableExists = false
    try {
      const { count } = await supabaseAdmin.from('lecture_content').select('*', { count: 'exact', head: true })
      tableExists = true
      console.log('جدول lecture_content موجود بالفعل')
    } catch (e) {
      console.log('جدول lecture_content غير موجود، سيتم إنشاؤه')
    }
    
    // 2. إنشاء الجدول إذا لم يكن موجودًا
    const SQL = `
      CREATE TABLE IF NOT EXISTS lecture_content (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        lecture_id UUID REFERENCES lectures(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        content_url TEXT,
        thumbnail_url TEXT,
        content_text TEXT,
        duration_minutes INT,
        order_index INT DEFAULT 1,
        is_downloadable BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `
    await supabaseAdmin.rpc('exec', { sql: SQL })

    const ALTER_SQL = `
      ALTER TABLE IF EXISTS lecture_content
      ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
    `
    await supabaseAdmin.rpc('exec', { sql: ALTER_SQL })
    
    // 3. إضافة index لتحسين الأداء
    const INDEX_SQL = `
      CREATE INDEX IF NOT EXISTS idx_lecture_content_lecture_id ON lecture_content(lecture_id);
    `
    await supabaseAdmin.rpc('exec', { sql: INDEX_SQL })
    
    // 4. إعادة تحميل schema cache بطريقتين مختلفتين
    try {
      // طريقة 1: استخدام وظيفة postgrest
      await supabaseAdmin.rpc('reload_schema_cache')
      
      // طريقة 2: استخدام إشعار postgresql
      await supabaseAdmin.rpc('exec', { 
        sql: `SELECT pg_notify('pgrst', 'reload schema');` 
      })
      
      // لنتأكد من وجود الحقول بعد التحديث
      if (!tableExists) {
        console.log('محاولة استعلام عن هيكل جدول lecture_content')
        await supabaseAdmin.rpc('exec', {
          sql: `
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'lecture_content';
          `
        })
      }
    } catch (e) {
      console.log('تعذر تحديث schema cache:', e)
    }
    
    console.log('تم التأكد من وجود جدول lecture_content')
  } catch (error) {
    console.error('خطأ في إنشاء جدول lecture_content:', error)
  }
}

export async function GET(req: NextRequest) {
  const lectureId = new URL(req.url).searchParams.get('lectureId')
  if (!lectureId) return NextResponse.json({ error: 'lectureId required' }, { status: 400 })
  let { data, error } = await supabaseAdmin
    .from('lecture_content')
    .select('*')
    .eq('lecture_id', lectureId)
    .order('order_index')
  if (error) {
    await ensureLectureContentTable()
    const retry = await supabaseAdmin
      .from('lecture_content')
      .select('*')
      .eq('lecture_id', lectureId)
      .order('order_index')
    data = retry.data as any
    error = retry.error as any
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  return NextResponse.json({ items: data || [] })
}

export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) {
      return NextResponse.json({ error: 'FORBIDDEN', details: 'لا تملك صلاحية الأدمن لإضافة محتوى' }, { status: 403 })
    }
    
    // تحليل بيانات الطلب
    const body = await req.json()
    const { lecture_id, ...fields } = body || {}
    
    // التحقق من وجود البيانات المطلوبة
    if (!lecture_id) {
      return NextResponse.json({ error: 'LECTURE_ID_REQUIRED', details: 'معرف المحاضرة مطلوب' }, { status: 400 })
    }
    if (!fields?.title) {
      return NextResponse.json({ error: 'TITLE_REQUIRED', details: 'عنوان المحتوى مطلوب' }, { status: 400 })
    }
    if (!fields?.type) {
      return NextResponse.json({ error: 'TYPE_REQUIRED', details: 'نوع المحتوى مطلوب' }, { status: 400 })
    }
    
    console.log(`إضافة محتوى جديد للمحاضرة ${lecture_id} من النوع ${fields.type}`)
    
    // التأكد من وجود الجدول وإنشاء المحتوى
    await ensureLectureContentTable()
    
    // تنظيف البيانات للتأكد من ملاءمتها لهيكل الجدول
    const sanitizedFields = {
      ...fields,
      title: fields.title || '',
      description: fields.description ?? '',  // ضمان أن description لن يكون undefined
      content_url: fields.content_url || null,
      thumbnail_url: fields.thumbnail_url || null,
      content_text: fields.content_text || null,
      duration_minutes: typeof fields.duration_minutes === 'number' ? fields.duration_minutes : null,
      order_index: typeof fields.order_index === 'number' ? fields.order_index : 1,
      is_downloadable: Boolean(fields.is_downloadable)
    }
    
    console.log('بيانات المحتوى المنظفة:', sanitizedFields)
    
    // استخدام SQL مباشر لتجاوز مشكلات Schema Cache
    let insertedData = null;
    let insertError = null;
    
    try {
      // الطريقة الأولى: استخدام rpc exec مباشرة
      const insertSQL = `
        INSERT INTO public.lecture_content (lecture_id, type, title, description, content_url, thumbnail_url, content_text, duration_minutes, order_index, is_downloadable)
        VALUES ('${lecture_id}', '${sanitizedFields.type}', '${sanitizedFields.title.replace(/'/g, "''")}', '${(sanitizedFields.description || '').replace(/'/g, "''")}', 
          ${sanitizedFields.content_url ? `'${sanitizedFields.content_url.replace(/'/g, "''")}'` : 'NULL'}, 
          ${sanitizedFields.thumbnail_url ? `'${sanitizedFields.thumbnail_url.replace(/'/g, "''")}'` : 'NULL'}, 
          ${sanitizedFields.content_text ? `'${sanitizedFields.content_text.replace(/'/g, "''")}'` : 'NULL'}, 
          ${sanitizedFields.duration_minutes || 'NULL'}, 
          ${sanitizedFields.order_index || 1}, 
          ${sanitizedFields.is_downloadable ? 'TRUE' : 'FALSE'}
        ) RETURNING id, lecture_id, type, title, description, content_url, thumbnail_url, content_text, duration_minutes, order_index, is_downloadable, created_at;
      `;
      
      console.log('محاولة استخدام SQL مباشر:', insertSQL);
      const { data, error } = await supabaseAdmin.rpc('exec', { sql: insertSQL });
      
      if (!error && data) {
        insertedData = data;
      }
    } catch (err) {
      console.error('فشل استخدام SQL مباشر:', err);
      insertError = err;
    }
    
    if (insertError) {
      console.error('خطأ في إضافة محتوى المحاضرة (SQL مباشر):', insertError)
      
      // خطة بديلة: نجرب مع API العادي إذا فشلت الطريقة المباشرة
      const { data, error } = await supabaseAdmin
        .from('lecture_content')
        .insert({
          lecture_id,
          ...sanitizedFields
        })
        .select('*')
      
      if (error) {
        console.error('خطأ في إضافة محتوى المحاضرة (الطريقة البديلة):', error)
        return NextResponse.json({ 
          error: 'INSERT_ERROR', 
          details: error.message, 
          code: error.code,
          fields: sanitizedFields
        }, { status: 500 })
      }
      
      console.log(`تم إضافة المحتوى بنجاح (الطريقة البديلة): ${data?.[0]?.id}`)
      return NextResponse.json({ item: data?.[0], success: true })
    }
    
    console.log(`تم إضافة المحتوى بنجاح (SQL مباشر): ${JSON.stringify(insertedData)}`)
    return NextResponse.json({ item: insertedData?.[0], success: true })
  } catch (e: any) {
    console.error('خطأ غير متوقع أثناء إضافة محتوى المحاضرة:', e)
    return NextResponse.json({ 
      error: 'UNEXPECTED_ERROR', 
      details: e.message || 'حدث خطأ غير متوقع أثناء إضافة المحتوى',
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const body = await req.json()
  const { id, ...fields } = body || {}
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  let { data, error } = await supabaseAdmin.from('lecture_content').update(fields).eq('id', id).select('*')
  if (error) {
    await ensureLectureContentTable()
    const retry = await supabaseAdmin.from('lecture_content').update(fields).eq('id', id).select('*')
    data = retry.data as any
    error = retry.error as any
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  return NextResponse.json({ item: data?.[0] })
}

export async function DELETE(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 })
  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  let { error } = await supabaseAdmin.from('lecture_content').delete().eq('id', id)
  if (error) {
    await ensureLectureContentTable()
    const retry = await supabaseAdmin.from('lecture_content').delete().eq('id', id)
    error = retry.error as any
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }
  return NextResponse.json({ ok: true })
}
