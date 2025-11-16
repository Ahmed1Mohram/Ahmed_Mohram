'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function GoAdminPage() {
  const router = useRouter()

  useEffect(() => {
    // تعيين بيانات المسؤول فوراً
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminOverride', 'true')
    
    const adminUser = {
      id: 'go-admin',
      email: 'admin@education.com',
      role: 'admin',
      full_name: 'مسؤول النظام'
    }
    localStorage.setItem('user', JSON.stringify(adminUser))
    
    // انتقال فوري للوحة الإدارة الفائقة
    window.location.href = '/super-admin'
  }, [])

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-white text-xl">جاري الانتقال للوحة الإدارة...</p>
      </div>
    </div>
  )
}
