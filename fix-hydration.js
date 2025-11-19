// إصلاح أخطاء Hydration في التطبيق
// قم بإضافة هذا الكود في أحد مكونات المشروع العليا مثل app/layout.tsx

'use client';

import { useEffect, useState } from 'react';

// مكوّن يمنع أخطاء Hydration عن طريق تأخير العرض حتى اكتمال Hydration
export function ClientOnly({ children }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    if (!isMounted) {
        return null; // أو عرض حالة تحميل بسيطة جدًا لا تسبب مشاكل Hydration
    }

    return < > { children } < />;
}

// طريقة استخدام المكون:
/*
import { ClientOnly } from '@/path/to/fix-hydration';

function MyComponent() {
  return (
    <div>
      {/* محتوى ثابت لا يتغير */
} <
h1 > عنوان ثابت < /h1>

{ /* أي محتوى ديناميكي يمكن أن يسبب مشاكل hydration */ } <
ClientOnly >
    <
    div > { new Date().toLocaleString() } < /div> <
    div > { Math.random() } < /div> <
    div > { window.innerWidth }
px < /div> <
    /ClientOnly> <
    /div>
);
} *
/