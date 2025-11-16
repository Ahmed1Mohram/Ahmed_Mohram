'use client'

import React, { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function AccessDeniedPage() {
  const router = useRouter()
  
  // إعادة التوجيه بعد 10 ثوانٍ
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/')
    }, 10000)
    
    return () => clearTimeout(timer)
  }, [router])
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-black border border-red-500/30 rounded-2xl p-8 shadow-2xl shadow-red-500/20"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="p-4 rounded-full bg-red-500/20 text-red-500"
          >
            <Shield className="w-12 h-12" />
          </motion.div>
        </div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl sm:text-4xl font-bold text-white text-center mb-4"
        >
          غير مصرح بالوصول
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-center mb-8"
        >
          عذراً، ليس لديك الصلاحيات اللازمة للوصول إلى هذه الصفحة.
          <br />
          سيتم إعادة توجيهك إلى الصفحة الرئيسية خلال ١٠ ثوان.
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex justify-center"
        >
          <Link href="/" className="flex items-center gap-2 text-gold hover:text-gold-light transition-colors px-6 py-2 rounded-lg border border-gold/20 hover:border-gold/40">
            <ArrowLeft className="w-5 h-5" />
            العودة للصفحة الرئيسية
          </Link>
        </motion.div>
      </motion.div>
    </div>
  )
}