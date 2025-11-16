# إصلاح أخطاء API الاشتراكات والدفعات

## المشاكل التي تم إصلاحها:

### 1. خطأ في API تحديد الباقة (`/api/save-package-selection`):
- المشكلة: `Could not find the 'device_info' column of 'users' in the schema cache`
- الحل: تم إزالة محاولة تحديث عمود `device_info` في جدول المستخدمين، واستخدام الأعمدة المتاحة فقط

### 2. خطأ في API طلب الدفع (`/api/payment-request`):
- المشكلة: `HTTP 400 Bad Request`
- الحل المحتمل: قد تكون المشكلة في معالجة الملفات المرفقة أو في البيانات المرسلة

## التغييرات المطبقة:

### في ملف `app/api/save-package-selection/route.ts`:
```typescript
// تغيير من
const { error: updateError, data } = await supabase
  .from('users')
  .update({
    selected_package_id: packageId,
    selected_package_name: packageName,
    device_info: deviceInfo,
    updated_at: new Date().toISOString()
  })

// إلى
const { error: updateError, data } = await supabase
  .from('users')
  .update({
    selected_package_id: packageId,
    package_name: packageName,
    updated_at: new Date().toISOString()
  })
```

### المشاكل المحتملة الأخرى:

1. **عدم تطابق أسماء الأعمدة**: يجب التأكد من أن أسماء الأعمدة المستخدمة في الاستعلامات تتطابق مع أسماء الأعمدة في قاعدة البيانات

2. **معالجة الملفات**: قد تكون هناك مشاكل في رفع الملفات في API طلب الدفع

3. **التحقق من الحقول الإلزامية**: قد يكون هناك حقول إلزامية غير مرسلة في طلب الدفع

## توصيات إضافية:

1. **استخدام TypeScript بشكل أفضل**: تعريف واجهات (interfaces) للبيانات المتوقعة من قاعدة البيانات لتجنب الأخطاء في أسماء الأعمدة

2. **تحسين معالجة الأخطاء**: استخدام try/catch وعرض رسائل خطأ أكثر وضوحاً للمستخدم

3. **استخدام المتغيرات البيئية**: تخزين معلومات الاتصال بقاعدة البيانات وأرقام الهواتف في ملف `.env.local`

4. **تقليل تكرار الكود**: استخراج الوظائف المتكررة إلى وحدات منفصلة قابلة لإعادة الاستخدام
