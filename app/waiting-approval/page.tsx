'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { Clock, CheckCircle, XCircle, Phone, MessageCircle } from 'lucide-react'
import { useAuth } from '@/components/providers'

export default function WaitingApprovalPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [checkingStatus, setCheckingStatus] = useState(false)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
      return
    }

    if (user) {
      checkUserStatus()
      // Check status every 30 seconds
      const interval = setInterval(checkUserStatus, 30000)
      return () => clearInterval(interval)
    }
  }, [user, loading])

  const checkUserStatus = async () => {
    if (!user) return
    
    setCheckingStatus(true)
    try {
      const response = await fetch(`/api/check-status?userId=${user.id}`)
      const data = await response.json()
      
      if (data.status === 'approved') {
        setStatus('approved')
        setTimeout(() => {
          router.push('/dashboard')
        }, 3000)
      } else if (data.status === 'rejected') {
        setStatus('rejected')
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleContactSupport = () => {
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/201005209667?text=${encodeURIComponent('مرحباً، أريد الاستفسار عن حالة اشتراكي')}`, '_blank')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="luxury-card rounded-3xl p-8 max-w-lg w-full text-center"
      >
        {status === 'pending' && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <Clock className="w-full h-full text-yellow-500" />
            </motion.div>
            
            <h1 className="text-3xl font-bold gradient-text mb-4">
              في انتظار الموافقة
            </h1>
            
            <p className="text-white/80 mb-6">
              مرحباً <span className="font-bold text-gold">{user?.full_name || user?.email}</span>
              <br />
              طلبك قيد المراجعة من قبل أحمد محرم
              <br />
              سيتم الموافقة خلال دقائق قليلة
            </p>

            <div className="bg-black/50 rounded-xl p-4 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white/60">حالة الطلب:</span>
                <span className="text-yellow-500 font-bold">قيد المراجعة</span>
              </div>
              <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden mt-3">
                <motion.div
                  className="h-full bg-gradient-to-r from-yellow-500 to-gold"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  style={{ width: '50%' }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={checkUserStatus}
                disabled={checkingStatus}
                className="flex-1 bg-gradient-to-r from-gold to-yellow-500 text-black py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-gold/30 transition-all disabled:opacity-50"
              >
                {checkingStatus ? 'جاري التحقق...' : 'تحديث الحالة'}
              </button>
              
              <button
                onClick={handleContactSupport}
                className="flex-1 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-all flex items-center justify-center gap-2"
              >
                <MessageCircle className="w-5 h-5" />
                تواصل معنا
              </button>
            </div>

            <p className="text-white/50 text-sm mt-4">
              يتم تحديث الحالة تلقائياً كل 30 ثانية
            </p>
          </>
        )}

        {status === 'approved' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <CheckCircle className="w-full h-full text-green-500" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-green-500 mb-4">
              تمت الموافقة! 🎉
            </h1>
            
            <p className="text-white/80 mb-6">
              مبروك! تم قبول اشتراكك بنجاح
              <br />
              جاري تحويلك للمنصة...
            </p>

            <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          </>
        )}

        {status === 'rejected' && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 mx-auto mb-6"
            >
              <XCircle className="w-full h-full text-red-500" />
            </motion.div>
            
            <h1 className="text-3xl font-bold text-red-500 mb-4">
              تم رفض الطلب
            </h1>
            
            <p className="text-white/80 mb-6">
              عذراً، تم رفض طلب اشتراكك
              <br />
              يرجى التواصل معنا لمعرفة السبب
            </p>

            <button
              onClick={handleContactSupport}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-green-500/30 transition-all"
            >
              <MessageCircle className="w-5 h-5" />
              تواصل عبر WhatsApp
            </button>

            <button
              onClick={() => router.push('/subscription')}
              className="w-full mt-3 bg-white/10 text-white py-3 rounded-xl font-bold hover:bg-white/20 transition-all"
            >
              إعادة المحاولة
            </button>
          </>
        )}
      </motion.div>
    </div>
  )
}
