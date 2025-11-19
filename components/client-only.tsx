'use client';

import { useEffect, useState, ReactNode } from 'react';

// مكوّن يمنع أخطاء Hydration عن طريق تأخير العرض حتى اكتمال Hydration
export function ClientOnly({ children }: { children: ReactNode }) {
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  if (!isMounted) {
    return null; // أو عرض حالة تحميل بسيطة جدًا لا تسبب مشاكل Hydration
  }
  
  return <>{children}</>;
}
