import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/db-client'
 

// دالة لاستخراج المبلغ من النص
function extractAmount(text: string): number | null {
  // البحث عن الأنماط المختلفة للمبلغ
  const patterns = [
    /(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)\s*(?:جنيه|EGP|L\.E|LE)/gi,
    /(?:المبلغ|Amount|القيمة|Total|الإجمالي)[:\s]*(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/gi,
    /(\d{3,})\s*(?:جنيه|EGP|L\.E|LE)/gi,
    /(?:200|٢٠٠)\s*(?:جنيه|EGP|L\.E|LE)/gi
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      // استخراج الرقم من المطابقة
      const numberStr = match[0].replace(/[^\d.]/g, '')
      const amount = parseFloat(numberStr)
      
      // التحقق من أن المبلغ 200 جنيه أو أكثر
      if (amount >= 200) {
        return amount
      }
    }
  }
  
  // البحث عن الرقم 200 مباشرة
  if (text.includes('200') || text.includes('٢٠٠')) {
    return 200
  }
  
  return null
}

// دالة لاستخراج رقم الهاتف
function extractPhoneNumber(text: string): string | null {
  // البحث عن رقم الهاتف المستهدف
  const targetPhonePatterns = [
    /01005209667/g,
    /010\s*0520\s*9667/g,
    /٠١٠٠٥٢٠٩٦٦٧/g
  ]
  
  for (const pattern of targetPhonePatterns) {
    if (pattern.test(text)) {
      return '01005209667'
    }
  }
  
  return null
}

// دالة لاستخراج رقم المرجع
function extractReferenceNumber(text: string): string | null {
  const patterns = [
    /(?:Reference|المرجع|Ref|رقم المرجع)[:\s]*([A-Z0-9]+)/gi,
    /(?:Transaction|المعاملة|Trans)[:\s]*([A-Z0-9]+)/gi,
    /([A-Z0-9]{8,})/g // أي رقم مرجع طويل
  ]
  
  for (const pattern of patterns) {
    const match = text.match(pattern)
    if (match) {
      return match[1] || match[0]
    }
  }
  
  return null
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const imageFile = formData.get('image') as File
    const userId = formData.get('userId') as string
    
    if (!imageFile || !userId) {
      return NextResponse.json({ 
        error: 'الصورة ومعرف المستخدم مطلوبان' 
      }, { status: 400 })
    }
    
    // تحويل الصورة إلى Buffer
    const buffer = Buffer.from(await imageFile.arrayBuffer())
    
    // استخدام Tesseract للتعرف على النص (استيراد ديناميكي لتقليل حجم الحزمة)
    const { default: Tesseract } = await import('tesseract.js')
    const { data: { text } } = await Tesseract.recognize(
      buffer,
      'ara+eng', // العربية والإنجليزية
      {
        logger: (m) => console.log(m)
      }
    )
    
    console.log('Extracted text:', text)
    
    // تحليل النص المستخرج
    const amount = extractAmount(text)
    const phoneNumber = extractPhoneNumber(text)
    const referenceNumber = extractReferenceNumber(text)
    
    // التحقق من صحة الإيصال
    const isValid = amount === 200 && phoneNumber === '01005209667'
    
    if (isValid) {
      // قبول المستخدم تلقائياً
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({
          status: 'approved',
          subscription_status: 'active',
          subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', userId)
      
      if (!updateError) {
        // حفظ سجل الدفع
        await supabaseAdmin
          .from('payments')
          .insert({
            user_id: userId,
            amount: amount,
            payment_method: 'vodafone_cash',
            transaction_id: referenceNumber,
            status: 'auto_approved',
            approved_at: new Date().toISOString(),
            notes: `تمت الموافقة تلقائياً - OCR`
          })
        
        // إرسال إشعار للأدمن
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'payment',
            title: 'دفعة تمت الموافقة عليها تلقائياً',
            message: `تم قبول دفعة بقيمة ${amount} جنيه تلقائياً عبر OCR`
          })
        
        return NextResponse.json({
          success: true,
          autoApproved: true,
          message: 'تم قبول الإيصال والموافقة على الاشتراك تلقائياً',
          data: {
            amount,
            phoneNumber,
            referenceNumber
          }
        })
      }
    }
    
    // إذا لم يكن صالحاً، حفظ الطلب للمراجعة اليدوية
    await supabaseAdmin
      .from('payments')
      .insert({
        user_id: userId,
        amount: amount || 0,
        payment_method: 'vodafone_cash',
        transaction_id: referenceNumber,
        status: 'pending',
        notes: `OCR: المبلغ ${amount}, الرقم ${phoneNumber}`
      })
    
    return NextResponse.json({
      success: true,
      autoApproved: false,
      message: 'تم استلام الإيصال وسيتم مراجعته يدوياً',
      data: {
        amount,
        phoneNumber,
        referenceNumber,
        extractedText: text.substring(0, 200) // أول 200 حرف للمراجعة
      }
    })
    
  } catch (error: any) {
    console.error('OCR error:', error)
    return NextResponse.json({ 
      error: 'فشل قراءة الإيصال',
      details: error.message 
    }, { status: 500 })
  }
}
