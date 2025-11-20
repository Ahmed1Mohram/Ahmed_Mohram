'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, CreditCard, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'
import SubscriptionManager from '../components/SubscriptionManager'

export default function AdminSubscriptionsPage() {
  const router = useRouter()
  const [checkedAuth, setCheckedAuth] = useState(false)
  const [isAllowed, setIsAllowed] = useState(false)

  useEffect(() => {
    try {
      let isAdmin = false

      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('isAdmin')
        if (stored === 'true') {
          isAdmin = true
        }

        if (!isAdmin) {
          const cookieString = document.cookie || ''
          const cookies = cookieString.split(';').map((c) => c.trim())
          const isAdminCookie = cookies.find((c) => c.startsWith('isAdmin='))
          if (isAdminCookie && isAdminCookie.split('=')[1] === 'true') {
            isAdmin = true
            localStorage.setItem('isAdmin', 'true')
          }
        }
      }

      if (!isAdmin) {
        toast.error('يرجى تسجيل الدخول كأدمن')
        router.push('/login')
      } else {
        setIsAllowed(true)
      }
    } catch {
      router.push('/login')
    } finally {
      setCheckedAuth(true)
    }
  }, [router])

  const handleLogout = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('isAdmin')
        localStorage.removeItem('session')
        document.cookie = 'isAdmin=; path=/; max-age=0'
      }
    } catch {}

    toast.success('تم تسجيل الخروج بنجاح')
    router.push('/login')
  }

  if (!checkedAuth) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAllowed) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white/70">جاري التحقق من صلاحيات الأدمن...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      <header className="luxury-card backdrop-blur-xl border-b border-gold/20 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-gradient-to-br from-gold to-gold-dark rounded-xl">
            <Crown className="w-6 h-6 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-black gradient-text-animated flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              <span>إدارة اشتراكات المستخدمين</span>
            </h1>
            <p className="text-white/60 text-sm">
              هذه الصفحة مخصصة فقط لمراجعة الاشتراكات المعلقة وتفعيلها وإرسال كارت الدخول للمنصة.
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>خروج</span>
        </button>
      </header>

      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          <SubscriptionManager />
        </div>
      </main>
    </div>
  )
}
