'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from './providers'
import toast from 'react-hot-toast'

interface AuthGuardProps {
  children: React.ReactNode
  requireAdmin?: boolean
  requireSubscription?: boolean
}

export default function AuthGuard({ 
  children, 
  requireAdmin = false, 
  requireSubscription = false 
}: AuthGuardProps) {
  const { user, loading, isAdmin } = useAuth()
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    if (!loading) {
      // التحقق من تسجيل الدخول
      if (!user) {
        toast.error('يرجى تسجيل الدخول أولاً')
        router.push('/login')
        return
      }

      // التحقق من صلاحيات الأدمن
      if (requireAdmin && !isAdmin) {
        toast.error('غير مصرح لك بالوصول لهذه الصفحة')
        router.push('/dashboard')
        return
      }

      // التحقق من الاشتراك (إذا كان مطلوباً)
      if (requireSubscription && !isAdmin) {
        // يمكن إضافة التحقق من حالة الاشتراك هنا
        checkSubscriptionStatus()
      }

      setIsChecking(false)
    }
  }, [user, loading, isAdmin, requireAdmin, requireSubscription, router])

  const checkSubscriptionStatus = async () => {
    try {
      const response = await fetch('/api/check-subscription')
      const result = await response.json()
      
      if (!result.active && requireSubscription) {
        toast.error('اشتراكك غير نشط')
        router.push('/subscription')
        return
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  // شاشة تحميل
  if (loading || isChecking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/70">جاري التحقق من البيانات...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}