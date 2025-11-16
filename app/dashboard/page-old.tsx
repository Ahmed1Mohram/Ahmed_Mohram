'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import toast from 'react-hot-toast'
import WelcomeScreen from '@/components/WelcomeScreen'
import { 
  BookOpen, Video, Trophy, MessageCircle, 
  Crown, Star, TrendingUp, Award,
  ChevronRight, Sparkles, Diamond,
  CheckCircle, User, AlertTriangle, Clock
} from 'lucide-react'
import { supabase } from '@/components/providers'

 

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()
  
  useEffect(() => {
    // Check for welcome screen
    const shouldShowWelcome = localStorage.getItem('showWelcome') === 'true'
    const newUserName = localStorage.getItem('newUserName')
    
    if (shouldShowWelcome && newUserName) {
      setShowWelcome(true)
      setUserName(newUserName)
      // Clear the flags
      localStorage.removeItem('showWelcome')
      localStorage.removeItem('newUserName')
    }
    
    if (!user) {
      router.push('/login')
      return
    }
    
    async function getUserData() {
      try {
        const { data, error } = await fetch('/api/check-subscription').then(res => res.json())
        
        if (error) {
          console.error('Error fetching user data:', error)
          toast.error('تعذر الوصول إلى بيانات المستخدم')
        } else {
          setUserData(data)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }
    
    getUserData()
  }, [user, router])
  
  if (showWelcome) {
    return <WelcomeScreen userName={userName} onComplete={() => setShowWelcome(false)} />
  }
  
  if (!user || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="luxury-card rounded-3xl shadow-2xl p-8 mb-8 backdrop-blur-xl"
        >
          <h1 className="text-3xl md:text-4xl font-black gradient-text-animated mb-4">
            مرحباً في لوحة التحكم
          </h1>
          <div className="flex flex-wrap justify-between items-center">
            <div>
              <p className="text-white/60 mb-1">البريد الإلكتروني: <span className="text-white font-medium">{user.email}</span></p>
              <p className="text-white/60">
                حالة الاشتراك: {' '}
                <span className={`font-bold ${userData?.subscription_status === 'active' ? 'text-green-400' : 'text-gold/60'}`}>
                  {userData?.subscription_status === 'active' ? 'نشط' : 'غير نشط'}
                </span>
              </p>
            </div>
            <button
              onClick={async () => {
                await signOut()
                router.push('/')
              }}
              className="px-6 py-3 bg-black/50 border border-gold/20 hover:bg-black/70 hover:border-gold/40 text-gold rounded-xl transition-all"
            >
              تسجيل الخروج
            </button>
          </div>
        </motion.div>
        
        {/* التحقق من حالة الاشتراك */}
        {userData && userData.status === 'pending' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="luxury-card rounded-3xl p-6 mb-8 border-2 border-yellow-500/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Clock className="w-8 h-8 text-yellow-500 animate-pulse" />
                <div>
                  <h3 className="text-xl font-bold text-white">في انتظار الموافقة</h3>
                  <p className="text-white/70">طلبك قيد المراجعة من أحمد محرم وسيتم قبوله قريباً</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/waiting-approval')}
                className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-yellow-500/30 transition-all"
              >
                تحديث الحالة
              </button>
            </div>
          </motion.div>
        ) : userData && userData.subscription_status !== 'active' ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="luxury-card rounded-3xl p-6 mb-8 border-2 border-red-500/50"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <AlertTriangle className="w-8 h-8 text-red-500" />
                <div>
                  <h3 className="text-xl font-bold text-white">اشتراكك غير نشط</h3>
                  <p className="text-white/70">قم بالاشتراك للوصول لجميع المحتويات التعليمية</p>
                </div>
              </div>
              <button 
                onClick={() => router.push('/subscription')}
                className="px-6 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-xl hover:shadow-lg hover:shadow-gold/50 transition-all"
              >
                اشترك الآن
              </button>
            </div>
          </motion.div>
        ) : null}
        
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="luxury-card rounded-2xl p-6 text-center"
          >
            <BookOpen className="w-8 h-8 text-gold mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white">4</h3>
            <p className="text-gray-400 text-sm">المواد المتاحة</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="luxury-card rounded-2xl p-6 text-center"
          >
            <Video className="w-8 h-8 text-gold mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white">24</h3>
            <p className="text-gray-400 text-sm">محاضرة</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="luxury-card rounded-2xl p-6 text-center"
          >
            <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white">85%</h3>
            <p className="text-gray-400 text-sm">معدل الإنجاز</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="luxury-card rounded-2xl p-6 text-center"
          >
            <Award className="w-8 h-8 text-gold mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white">3</h3>
            <p className="text-gray-400 text-sm">شهادات</p>
          </motion.div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
            onClick={() => router.push('/subjects')}
            className="luxury-card rounded-2xl overflow-hidden cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-gold to-yellow-600">
                  <BookOpen className="w-6 h-6 text-black" />
                </div>
                <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">المواد الدراسية</h3>
              <p className="text-gray-400 text-sm">
                استعرض جميع المواد المتاحة وابدأ رحلتك التعليمية
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                <span className="text-xs text-gold">محتوى جديد متاح</span>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-gold to-yellow-600"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            whileHover={{ y: -5 }}
            onClick={() => router.push('/exam')}
            className="luxury-card rounded-2xl overflow-hidden cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">الامتحانات</h3>
              <p className="text-gray-400 text-sm">
                اختبر معرفتك من خلال الامتحانات التفاعلية
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-blue-400">3 امتحانات جديدة</span>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-blue-500 to-purple-600"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            whileHover={{ y: -5 }}
            onClick={() => toast('قريباً...', { icon: '🔜' })}
            className="luxury-card rounded-2xl overflow-hidden cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-green-500 to-teal-600">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">المحادثات</h3>
              <p className="text-gray-400 text-sm">
                تواصل مع المدرس واحصل على إجابات فورية
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Diamond className="w-4 h-4 text-green-400" />
                <span className="text-xs text-green-400">متاح 24/7</span>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-green-500 to-teal-600"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            whileHover={{ y: -5 }}
            onClick={() => router.push('/subscription')}
            className="luxury-card rounded-2xl overflow-hidden cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-red-500 to-pink-600">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">الاشتراك</h3>
              <p className="text-gray-400 text-sm">
                احصل على وصول كامل لجميع المحتويات المميزة
              </p>
              <div className="mt-4">
                {userData?.subscription_status === 'active' ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400">اشتراك نشط</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Crown className="w-4 h-4 text-gold" />
                    <span className="text-xs text-gold">اشترك الآن</span>
                  </div>
                )}
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-red-500 to-pink-600"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
            whileHover={{ y: -5 }}
            onClick={() => router.push('/profile')}
            className="luxury-card rounded-2xl overflow-hidden cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600">
                  <User className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">الملف الشخصي</h3>
              <p className="text-gray-400 text-sm">
                قم بتحديث معلوماتك الشخصية وإعدادات الحساب
              </p>
            </div>
            <div className="h-1 bg-gradient-to-r from-purple-500 to-indigo-600"></div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            whileHover={{ y: -5 }}
            onClick={() => toast('قريباً...', { icon: '🔜' })}
            className="luxury-card rounded-2xl overflow-hidden cursor-pointer group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <ChevronRight className="w-5 h-5 text-gold group-hover:translate-x-1 transition-transform" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">التقدم</h3>
              <p className="text-gray-400 text-sm">
                تابع تقدمك وإنجازاتك في جميع المواد
              </p>
              <div className="mt-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-orange-400" />
                <span className="text-xs text-orange-400">إنجاز جديد!</span>
              </div>
            </div>
            <div className="h-1 bg-gradient-to-r from-yellow-500 to-orange-600"></div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}