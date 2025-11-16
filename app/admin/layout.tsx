'use client';

import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // تبسيط الـ layout - المصادقة تتم عبر middleware.ts بناءً على cookies
  // لا حاجة لمنطق مصادقة إضافي هنا
  
  return (
    <>
      {children}
    </>
  );
}
