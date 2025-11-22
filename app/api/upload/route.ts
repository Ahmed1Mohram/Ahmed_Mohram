import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'

function isAdmin(req: NextRequest) {
  const cookie = req.headers.get('cookie') || ''
  return /(?:^|;\s*)isAdmin=true(?:;|$)/.test(cookie)
}
export async function POST(req: NextRequest) {
  try {
    if (!isAdmin(req)) return NextResponse.json({ error: 'FORBIDDEN', details: 'لا تملك صلاحية الأدمن للرفع' }, { status: 403 })
    
    // تحليل بيانات الطلب
    const form = await req.formData()
    const file = form.get('file') as File | null
    const folder = (form.get('folder')?.toString() || 'misc').replace(/[^a-z0-9/_-]+/gi, '-')
    const lectureId = form.get('lectureId')?.toString()
    const customContentType = form.get('contentType')?.toString()

    if (!file) {
      return NextResponse.json({ error: 'FILE_REQUIRED', details: 'الملف مطلوب' }, { status: 400 })
    }

    console.log(`معالجة ملف: ${file.name}, الحجم: ${(file.size / 1024 / 1024).toFixed(2)}MB, النوع: ${file.type}`)

    // التأكد من وجود storage bucket واختيار اسم مناسب
    let bucketName = 'media'
    try {
      const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets()
      if (listError) {
        console.error('خطأ في listBuckets:', listError)
      }

      const mediaBucket = buckets?.find((b: { name: string }) => b.name === 'media')
      
      if (!mediaBucket) {
        console.log('إنشاء bucket جديد: media')
        const { error: createError } = await supabaseAdmin.storage.createBucket('media', { 
          public: true,
          fileSizeLimit: 1000000000 // 1GB لدعم الملفات الكبيرة
        })

        if (createError) {
          // إذا كان البكت موجود مسبقًا نتجاهل الخطأ، غير ذلك نطبع التفاصيل للمساعدة في التشخيص
          if (createError.message?.includes('already exists')) {
            console.log('Bucket media موجود مسبقًا، تجاهل خطأ الإنشاء')
          } else {
            console.error('فشل إنشاء bucket media، سيتم استخدام bucket بديل إن وجد:', createError)
          }
        }

        // في حالة فشل إنشاء media نحاول استخدام public أو أول bucket متاح
        if (createError) {
          const publicBucket = buckets?.find((b: { name: string }) => b.name === 'public')
          if (publicBucket) {
            bucketName = 'public'
            console.log('استخدام bucket public بدلاً من media')
          } else if (buckets && buckets.length > 0) {
            bucketName = buckets[0].name
            console.log('استخدام أول bucket متاح بدلاً من media:', bucketName)
          }
        }
      } else {
        bucketName = 'media'
      }
    } catch (e) {
      console.error('خطأ في التحقق/إنشاء bucket media:', e)
    }

    // معالجة اسم الملف للأمان
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const safeName = file.name
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .substring(0, 100) // تقييد طول الاسم

    // إنشاء المسار
    const path = `${folder}${lectureId ? '/' + lectureId : ''}/${timestamp}-${safeName}`

    console.log(`بدء رفع الملف إلى المسار: ${path}`)

    // تحديد نوع الملف بناءً على الامتداد إذا لم يكن محددًا
    let detectedContentType = file.type || 'application/octet-stream'
    
    // إذا كان نوع الملف غير محدد أو كان هناك نوع مخصص
    if (customContentType || detectedContentType === 'application/octet-stream') {
      const ext = fileExtension?.toLowerCase()
      if (customContentType) {
        detectedContentType = customContentType
      } else if (ext) {
        // تعيين أنواع MIME للملفات الشائعة
        const mimeTypes: Record<string, string> = {
          // فيديو
          'mp4': 'video/mp4',
          'webm': 'video/webm',
          'mov': 'video/quicktime',
          'avi': 'video/x-msvideo',
          'mkv': 'video/x-matroska',
          'flv': 'video/x-flv',
          
          // صوت
          'mp3': 'audio/mpeg',
          'wav': 'audio/wav',
          'ogg': 'audio/ogg',
          'm4a': 'audio/mp4',
          'aac': 'audio/aac',
          'flac': 'audio/flac',
          
          // مستندات
          'pdf': 'application/pdf',
          'doc': 'application/msword',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'ppt': 'application/vnd.ms-powerpoint',
          'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'xls': 'application/vnd.ms-excel',
          'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'odt': 'application/vnd.oasis.opendocument.text',
          'odp': 'application/vnd.oasis.opendocument.presentation',
          'ods': 'application/vnd.oasis.opendocument.spreadsheet',
          'rtf': 'application/rtf',
        }
        
        if (mimeTypes[ext]) {
          detectedContentType = mimeTypes[ext]
          console.log(`تم تحديد نوع الملف اعتمادًا على الامتداد: ${ext} -> ${detectedContentType}`)
        }
      }
    }
    
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = new Uint8Array(arrayBuffer)

    // رفع الملف إلى الـ bucket المحدد
    const { data, error: upErr } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(path, fileBuffer, {
        cacheControl: '3600',
        upsert: true, // السماح بالاستبدال لتجنب أخطاء الأسماء المتكررة
        contentType: detectedContentType,
      })

    if (upErr) {
      console.error('خطأ في رفع الملف:', upErr)
      return NextResponse.json({ 
        error: 'UPLOAD_ERROR', 
        code: upErr.code || 'unknown',
        details: upErr.message || 'حدث خطأ أثناء رفع الملف' 
      }, { status: 500 })
    }

    // الحصول على رابط عام
    const { data: urlData } = supabaseAdmin.storage.from(bucketName).getPublicUrl(path)

    console.log(`تم رفع الملف بنجاح: ${urlData.publicUrl}`)
    
    return NextResponse.json({ 
      ok: true, 
      bucket: bucketName, 
      path, 
      url: urlData.publicUrl,
      fileSize: file.size,
      fileType: file.type,
      contentType: detectedContentType,
      extension: fileExtension || ''
    })
  } catch (e: any) {
    console.error('خطأ غير متوقع أثناء رفع الملف:', e)
    return NextResponse.json({ 
      error: 'UPLOAD_ERROR', 
      details: e.message || 'حدث خطأ غير متوقع أثناء رفع الملف',
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 })
  }
}
