'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Shield, CheckCircle } from 'lucide-react'

export default function AdminAccessPage() {
  const router = useRouter()

  useEffect(() => {
    // تعيين أذونات المسؤول فوراً
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminOverride', 'true')
    
    const adminUser = {
      id: 'admin-access',
      email: 'admin@education.com',
      role: 'admin',
      full_name: 'مسؤول النظام'
    }
    localStorage.setItem('user', JSON.stringify(adminUser))
    
    console.log('تم تعيين أذونات المسؤول بنجاح')
    
    // انتظار ثانية واحدة ثم التوجه للوحة الإدارة
    const timer = setTimeout(() => {
      window.location.href = '/admin?force=true'
    }, 1500)
    
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="inline-block p-6 rounded-full bg-gold/10 mb-6"
        >
          <Shield className="w-12 h-12 text-gold" />
        </motion.div>
        
        <h1 className="text-3xl font-bold mb-4 gradient-text-gold">
          جاري تفعيل أذونات المسؤول...
        </h1>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex items-center justify-center gap-2 text-green-400 mb-4"
        >
          <CheckCircle className="w-5 h-5" />
          <span>تم تعيين الأذونات بنجاح</span>
        </motion.div>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-gray-400"
        >
          سيتم توجيهك إلى لوحة الإدارة خلال ثانية...
        </motion.p>
        
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: '100%' }}
          transition={{ duration: 1.5 }}
          className="h-1 bg-gold rounded-full mt-6 max-w-xs mx-auto"
        />
      </motion.div>
    </div>
  )
}
