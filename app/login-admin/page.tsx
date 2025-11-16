'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Lock, User, LogIn, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (formData.username.trim() === '' || formData.password.trim() === '') {
      toast.error('يرجى ملء جميع الحقول')
      return
    }
    
    setLoading(true)
    try {
      const baseUrl = window.location.origin
      console.log('جاري محاولة تسجيل دخول المسؤول...')
      console.log('استخدام العنوان:', `${baseUrl}/api/admin-login`)
      
      const response = await fetch(`${baseUrl}/api/admin-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({
          phoneNumber: formData.username,
          password: formData.password
        })
      })
      
      const result = await response.json()
      
      if (response.ok && result.success) {
        // حفظ بيانات المسؤول
        localStorage.setItem('user', JSON.stringify(result.user))
        localStorage.setItem('isAdmin', 'true')
        document.cookie = 'isAdmin=true; path=/; max-age=86400' // صالح لمدة 24 ساعة
        
        toast.success('تم تسجيل الدخول بنجاح!')
        
        // الانتقال إلى صفحة الإدارة بعد تأخير قصير
        setTimeout(() => {
          const adminUrl = `${baseUrl}/admin`
          console.log('الانتقال إلى صفحة الإدارة:', adminUrl)
          window.location.href = adminUrl
        }, 1000)
      } else {
        toast.error(result.error || 'فشل تسجيل الدخول')
      }
    } catch (error) {
      console.error('خطأ في تسجيل الدخول:', error)
      toast.error('حدث خطأ في الاتصال بالخادم')
    } finally {
      setLoading(false)
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-black border border-gold/30 rounded-2xl p-8 shadow-2xl shadow-gold/10"
      >
        <div className="flex justify-center mb-6">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 10 }}
            className="p-4 rounded-full bg-gold/20 text-gold"
          >
            <Shield className="w-12 h-12" />
          </motion.div>
        </div>
        
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-3xl font-bold text-center mb-2 gradient-text-gold"
        >
          لوحة المسؤول
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 text-center mb-8"
        >
          الرجاء تسجيل الدخول للوصول إلى لوحة الإدارة
        </motion.p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-medium text-gold/80 mb-2">
              اسم المستخدم
            </label>
            <div className="relative">
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="w-full px-12 py-4 bg-black/50 border border-gold/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-all"
                placeholder="أدخل اسم المستخدم"
              />
              <User className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold/50 w-5 h-5" />
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-medium text-gold/80 mb-2">
              كلمة المرور
            </label>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-12 py-4 bg-black/50 border border-gold/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-all"
                placeholder="••••••••"
              />
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gold/50 w-5 h-5" />
            </div>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-gold to-amber-600 text-black font-bold py-4 rounded-lg hover:from-gold hover:to-amber-500 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                جاري تسجيل الدخول...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                تسجيل الدخول
              </>
            )}
          </motion.button>
        </form>
        
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>بيانات الدخول الافتراضية:</p>
          <p className="mt-1">اسم المستخدم: <span className="text-gold">أحمد محرم</span></p>
          <p>كلمة المرور: <span className="text-gold">أحمد محرم</span></p>
        </div>
      </motion.div>
      
      <motion.p 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        className="text-gray-500 text-sm mt-6"
      >
        © {new Date().getFullYear()} منصة التعليم الذهبية
      </motion.p>
    </div>
  )
}
