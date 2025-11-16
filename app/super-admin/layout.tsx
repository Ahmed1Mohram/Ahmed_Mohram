'use client'

import React from 'react'

// Layout مبسط بدون أي فحوصات أمان
export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
    </>
  )
}
