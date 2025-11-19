# إصلاح مشاكل Hydration في تطبيق Next.js

## المشكلة

أخطاء Hydration تحدث عندما يكون هناك اختلاف بين ما يقوم Next.js بعرضه على الخادم وما يتوقع React رؤيته في المتصفح عند عملية الـ Hydration.

الخطأين الأساسيين الذين تواجههما:

1. `Text content does not match server-rendered HTML` - محتوى النص لا يتطابق مع HTML المعروض من الخادم
2. `Error while hydrating Suspense boundary` - خطأ أثناء hydration لمكون Suspense

## الحلول

### 1. استخدام مكون `ClientOnly`

لف المكونات التي تستخدم عناصر متغيرة (مثل `Date`, `Math.random`, `window` أو أي API خاص بالمتصفح) في مكون `ClientOnly`:

```jsx
import { ClientOnly } from '@/fix-hydration';

function MyComponent() {
  return (
    <div>
      {/* محتوى ثابت */}
      <h1>عنوان صفحة</h1>
      
      {/* محتوى ديناميكي - يُعرض فقط بعد اكتمال الـ hydration */}
      <ClientOnly>
        <p>الوقت الحالي: {new Date().toLocaleString()}</p>
        <ProfileData />
      </ClientOnly>
    </div>
  );
}
```

### 2. التأكد من ثبات القيم بين الخادم والعميل

استخدم استراتيجية `useEffect` للتأكد من أن القيم المتغيرة لا تُستخدم في العرض المبدئي:

```jsx
const [currentTime, setCurrentTime] = useState('');

// تعيين القيمة فقط بعد التحميل في المتصفح
useEffect(() => {
  setCurrentTime(new Date().toLocaleString());
}, []);
```

### 3. استخدم الاستراتيجيات المناسبة للبيانات الديناميكية

- استخدم `useEffect` لتحميل البيانات في المتصفح بدلاً من تحميلها أثناء العرض
- تجنب استخدام Local Storage أو Session Storage في وقت العرض الأولي
- عندما تحتاج إلى استخدام APIs للمتصفح، تأكد من التحقق أولاً:
  ```jsx
  if (typeof window !== 'undefined') {
    // استخدم APIs للمتصفح هنا
  }
  ```

### 4. أماكن محددة للتحقق

1. تحقق من أي مكان يستخدم `Date` أو `Math.random`
2. تحقق من مكونات التي تستخدم `useEffect` مع تغييرات على DOM
3. ابحث عن أي استخدام لـ localStorage أو cookies
4. تحقق من أي مكان يعرض أرقاماً عشوائية أو بيانات متغيرة

## تنفيذ الإصلاح

1. نسخ مكون `ClientOnly` من ملف `fix-hydration.js`
2. تحديد المكونات التي تسبب مشاكل hydration
3. لف هذه المكونات بمكون `ClientOnly`
4. إعادة تشغيل التطبيق واختباره

## مواقع للإصلاح المحتملة

1. المكونات التي تعرض الوقت أو التاريخ
2. المكونات التي تعرض بيانات المستخدم الحالي
3. المكونات التي تستخدم حالة متغيرة من Local Storage
4. أي مكان يستخدم معلومات المتصفح مثل window أو navigator
