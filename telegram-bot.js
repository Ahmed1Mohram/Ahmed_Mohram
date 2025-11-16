require('dotenv').config()
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard } = require('grammy')
const { createClient } = require('@supabase/supabase-js')

// إعداد Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// إنشاء البوت - ضع التوكن هنا
const bot = new Bot(process.env.TELEGRAM_BOT_TOKEN || 'YOUR_BOT_TOKEN_HERE')

// تخزين معرفات المستخدمين
const userSessions = {}

// أمر البداية
bot.command('start', async (ctx) => {
  const welcomeMessage = `
🌟 *مرحباً بك في منصة أحمد محرم التعليمية* 🌟

أنا البوت الرسمي للمنصة، يمكنني مساعدتك في:
📚 معرفة آخر المحاضرات
📝 الاشتراك في المنصة  
💳 إرسال إيصالات الدفع
📊 معرفة درجاتك في الامتحانات
💬 التواصل مع الدعم

استخدم الأزرار أدناه للبدء:`

  const keyboard = new InlineKeyboard()
    .text('🔐 تسجيل الدخول', 'login')
    .text('📚 المحاضرات الجديدة', 'new_lectures')
    .row()
    .text('💳 الاشتراك', 'subscribe')
    .text('📞 الدعم', 'support')

  await ctx.reply(welcomeMessage, { 
    parse_mode: 'Markdown',
    reply_markup: keyboard 
  })
})

// تسجيل الدخول
bot.callbackQuery('login', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply('من فضلك أدخل رقم هاتفك المسجل في المنصة:')
  userSessions[ctx.from.id] = { state: 'awaiting_phone' }
})

// معالجة رقم الهاتف
bot.on('message:text', async (ctx) => {
  const userId = ctx.from.id
  const session = userSessions[userId]
  
  if (session?.state === 'awaiting_phone') {
    const phoneNumber = ctx.message.text.trim()
    
    // البحث عن المستخدم في قاعدة البيانات
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single()
    
    if (error || !user) {
      await ctx.reply('❌ رقم الهاتف غير مسجل في المنصة')
      return
    }
    
    // ربط حساب التيليجرام
    await supabase
      .from('telegram_users')
      .upsert({
        user_id: user.id,
        telegram_id: userId,
        telegram_username: ctx.from.username,
        is_active: true
      })
    
    userSessions[userId] = { ...session, user_id: user.id, user }
    
    await ctx.reply(`✅ تم تسجيل الدخول بنجاح!
مرحباً *${user.full_name}*
حالة الاشتراك: ${user.subscription_status === 'active' ? '✅ نشط' : '❌ غير نشط'}`, {
      parse_mode: 'Markdown'
    })
  }
  else if (session?.state === 'awaiting_receipt') {
    await ctx.reply('من فضلك أرسل صورة الإيصال، وليس نص')
  }
})

// استقبال الصور (إيصالات الدفع)
bot.on('message:photo', async (ctx) => {
  const userId = ctx.from.id
  const session = userSessions[userId]
  
  if (!session?.user_id) {
    await ctx.reply('يجب تسجيل الدخول أولاً. استخدم /start')
    return
  }
  
  const photo = ctx.message.photo[ctx.message.photo.length - 1]
  const caption = ctx.message.caption || ''
  
  await ctx.reply('✅ تم استلام إيصال الدفع وسيتم مراجعته قريباً')
  
  // إرسال الإيصال للأدمن
  const adminChatId = process.env.ADMIN_TELEGRAM_ID // ضع معرف التيليجرام الخاص بك هنا
  if (adminChatId) {
    await bot.api.sendPhoto(adminChatId, photo.file_id, {
      caption: `📸 إيصال دفع جديد من:
الاسم: ${session.user.full_name}
الهاتف: ${session.user.phone_number}
الوصف: ${caption}`,
      reply_markup: new InlineKeyboard()
        .text('✅ قبول', `approve_${session.user_id}`)
        .text('❌ رفض', `reject_${session.user_id}`)
    })
  }
  
  // حفظ طلب الدفع في قاعدة البيانات
  await supabase
    .from('payments')
    .insert({
      user_id: session.user_id,
      amount: 200, // المبلغ الافتراضي
      payment_method: 'vodafone_cash',
      status: 'pending',
      notes: caption
    })
})

// قبول أو رفض الدفع
bot.callbackQuery(/approve_(.+)/, async (ctx) => {
  const userId = ctx.match[1]
  
  // تحديث حالة المستخدم
  await supabase
    .from('users')
    .update({
      status: 'approved',
      subscription_status: 'active',
      subscription_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    .eq('id', userId)
  
  await ctx.answerCallbackQuery('✅ تم قبول الاشتراك')
  
  // إشعار المستخدم
  const { data: telegramUser } = await supabase
    .from('telegram_users')
    .select('telegram_id')
    .eq('user_id', userId)
    .single()
  
  if (telegramUser) {
    await bot.api.sendMessage(telegramUser.telegram_id, 
      '🎉 *مبروك!* تم قبول اشتراكك في المنصة\nيمكنك الآن الوصول لجميع المحتويات', 
      { parse_mode: 'Markdown' }
    )
  }
})

bot.callbackQuery(/reject_(.+)/, async (ctx) => {
  await ctx.answerCallbackQuery('❌ تم رفض الاشتراك')
  // يمكن إضافة منطق الرفض هنا
})

// عرض المحاضرات الجديدة
bot.callbackQuery('new_lectures', async (ctx) => {
  await ctx.answerCallbackQuery()
  
  const { data: lectures } = await supabase
    .from('lectures')
    .select('*, subjects(title)')
    .order('created_at', { ascending: false })
    .limit(5)
  
  if (lectures && lectures.length > 0) {
    let message = '📚 *آخر المحاضرات المضافة:*\n\n'
    lectures.forEach((lecture, index) => {
      message += `${index + 1}. *${lecture.title}*\n`
      message += `   المادة: ${lecture.subjects?.title}\n`
      message += `   المدة: ${lecture.duration_minutes} دقيقة\n\n`
    })
    
    await ctx.reply(message, { parse_mode: 'Markdown' })
  } else {
    await ctx.reply('لا توجد محاضرات جديدة حالياً')
  }
})

// الاشتراك
bot.callbackQuery('subscribe', async (ctx) => {
  await ctx.answerCallbackQuery()
  
  const message = `💳 *خطوات الاشتراك:*

1️⃣ قم بتحويل 200 جنيه على فودافون كاش: *01005209667*
2️⃣ أرسل صورة الإيصال هنا في البوت
3️⃣ انتظر الموافقة (خلال دقائق)
4️⃣ استمتع بجميع المحتويات!

للاشتراك عبر واتساب: wa.me/201005209667`

  await ctx.reply(message, { 
    parse_mode: 'Markdown',
    reply_markup: new InlineKeyboard()
      .text('📸 إرسال إيصال', 'send_receipt')
  })
})

bot.callbackQuery('send_receipt', async (ctx) => {
  await ctx.answerCallbackQuery()
  userSessions[ctx.from.id] = { 
    ...userSessions[ctx.from.id], 
    state: 'awaiting_receipt' 
  }
  await ctx.reply('📸 من فضلك أرسل صورة إيصال الدفع')
})

// الدعم
bot.callbackQuery('support', async (ctx) => {
  await ctx.answerCallbackQuery()
  await ctx.reply(`📞 *للتواصل مع الدعم:*

واتساب: wa.me/201005209667
تيليجرام: @ahmed_moharam
البريد: support@education.com

أوقات العمل: 9 صباحاً - 10 مساءً`, {
    parse_mode: 'Markdown'
  })
})

// معالجة الأخطاء
bot.catch((err) => {
  const ctx = err.ctx
  console.error(`Error while handling update ${ctx.update.update_id}:`)
  const e = err.error
  
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description)
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e)
  } else {
    console.error('Unknown error:', e)
  }
})

// بدء البوت
bot.start({
  onStart: () => console.log('🤖 البوت يعمل الآن!')
})

// وظيفة لإرسال رسائل جماعية (يمكن استدعاؤها من API)
async function sendBroadcastMessage(message, options = {}) {
  const { data: telegramUsers } = await supabase
    .from('telegram_users')
    .select('telegram_id')
    .eq('is_active', true)
  
  if (telegramUsers) {
    for (const user of telegramUsers) {
      try {
        await bot.api.sendMessage(user.telegram_id, message, {
          parse_mode: 'Markdown',
          ...options
        })
      } catch (error) {
        console.error(`Failed to send to ${user.telegram_id}:`, error)
      }
    }
  }
}

module.exports = { bot, sendBroadcastMessage }