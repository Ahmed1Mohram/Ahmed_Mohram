'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers'
import toast from 'react-hot-toast'
import { 
  BookOpen, Video, Trophy, MessageCircle, 
  Crown, Star, TrendingUp, Award, User,
  ChevronRight, Sparkles, Diamond, Calendar,
  CheckCircle, AlertTriangle, Clock, LogOut,
  Settings, Bell, Search, Menu, X, Send,
  FileText, Headphones, Play, Lock, Eye,
  Heart, Share2, Download, Brain, Stethoscope,
  Activity, Dna, Microscope, Pill, Camera,
  BarChart2, PieChart
} from 'lucide-react'

import StudentStats from '@/components/StudentStats'
import { supabase } from '@/components/providers'

 

interface Subject {
  id: string
  title: string
  description: string
  image_url: string
  icon: string
  color: string
  is_premium: boolean
  order_index: number
  lectures_count?: number
}

const defaultImages = [
  'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=800',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
  'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800'
]

export default function DashboardPage() {
  const { user, signOut, loading: authLoading } = useAuth()
  const [loading, setLoading] = useState(true)
  const [userData, setUserData] = useState<any>(null)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [recentLectures, setRecentLectures] = useState<any[]>([])
  const [examsPublished, setExamsPublished] = useState<any[]>([])
  const [latestResult, setLatestResult] = useState<any | null>(null)
  const [quickCompletionRate, setQuickCompletionRate] = useState(0)
  const [quickCertificates, setQuickCertificates] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [notificationsLoading, setNotificationsLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [showChat, setShowChat] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [messages, setMessages] = useState<any[]>([])
  const [adminOnline, setAdminOnline] = useState(false)
  const [adminTyping, setAdminTyping] = useState(false)
  const messagesChannelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<any>(null)
  const router = useRouter()
  const MAIN_SUBJECT_ID = '9c13de33-1c41-430d-8852-f4a3af7c9c6e'

  const totalSubjects = subjects.length
  const totalLectures = subjects.reduce((sum, s) => sum + (s.lectures_count || 0), 0)

  const fetchExamsPublished = async () => {
    try {
      const res = await fetch('/api/exams', { cache: 'no-store' })
      const json = await res.json()
      if (json.success) setExamsPublished(json.exams || [])
    } catch {}
  }

  const fetchLatestSubmission = async () => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const userId = user?.id || (userStr ? (JSON.parse(userStr)?.id || null) : null)
      if (!userId) return
      const res = await fetch(`/api/submit-exam?userId=${encodeURIComponent(userId)}&limit=1`, { cache: 'no-store' })
      const json = await res.json()
      const sub = (json?.submissions || [])[0]
      if (!sub) { setLatestResult(null); return }
      // جلب الامتحان لمعرفة إجمالي الأسئلة ونسبة النجاح
      const exRes = await fetch(`/api/exams/${sub.exam_id}`, { cache: 'no-store' })
      const exJson = await exRes.json()
      const exam = exJson?.exam
      const total = Array.isArray(exam?.questions) ? exam.questions.length : null
      const passThreshold = exam?.pass_threshold ?? null
      let percent: number | null = null
      let passed: boolean | null = null
      if (typeof sub.score === 'number' && typeof total === 'number' && total > 0) {
        percent = Math.round((sub.score / total) * 100)
        passed = typeof passThreshold === 'number' ? percent >= passThreshold : null
      }
      setLatestResult({
        examId: sub.exam_id,
        examTitle: exam?.title || 'امتحان',
        score: sub.score,
        total,
        percent,
        passThreshold,
        created_at: sub.created_at
      })
    } catch {
      setLatestResult(null)
    }
  }

  const loadNotifications = async (markRead: boolean) => {
    try {
      const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      setNotificationsLoading(true)
      const res = await fetch(`/api/notifications${markRead ? '?markRead=1' : ''}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': userDataStr || ''
        }
      })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok || !json?.success) return
      const list = Array.isArray(json.notifications) ? json.notifications : []
      setNotifications(list)
      if (typeof json.unreadCount === 'number') {
        setUnreadCount(json.unreadCount)
      } else {
        const uid = getCurrentUserId()
        if (uid) {
          const cnt = list.filter((n: any) => n.user_id === uid && n.is_read !== true).length
          setUnreadCount(cnt)
        }
      }
    } catch {
    } finally {
      setNotificationsLoading(false)
    }
  }

  useEffect(() => {
    if (authLoading) return
    const cookieString = typeof document !== 'undefined' ? document.cookie : ''
    const hasCookieLogin = cookieString.includes('loggedIn=true')
    if (!user) {
      if (hasCookieLogin) {
        try {
          const storedUserStr = localStorage.getItem('user')
          if (storedUserStr) {
            const storedUser = JSON.parse(storedUserStr)
            setUserData(storedUser)
            setLoading(false)
            fetchSubjects()
            fetchRecentLectures()
            fetchExamsPublished()
            fetchLatestSubmission()
            fetchQuickUserStats()
            return
          }
        } catch {}
      }
      router.push('/login')
      return
    }
    getUserData()
    fetchSubjects()
    fetchRecentLectures()
    fetchExamsPublished()
    fetchLatestSubmission()
    fetchQuickUserStats()
    loadNotifications(false)
  }, [user, router, authLoading])
  
  const getUserData = async () => {
    if (!user) return
    
    try {
      const data: any = user
      // التحقق من حالة المستخدم
      if (data) {
        if (data.status === 'pending') {
          toast.error('حسابك في انتظار الموافقة من الإدارة')
          router.push('/waiting-approval')
          return
        } else if (data.status === 'rejected') {
          toast.error('تم رفض طلبك. يرجى التواصل مع الإدارة')
          await signOut()
          router.push('/login')
          return
        } else if (data.status === 'banned') {
          toast.error('تم حظر حسابك')
          await signOut()
          router.push('/login')
          return
        }
        
        setUserData(data)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchRecentLectures = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select('id, title, description, thumbnail_url, is_free, duration_minutes, order_index, subject_id, created_at')
        .eq('subject_id', MAIN_SUBJECT_ID)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(6)
      if (error) throw error
      setRecentLectures(data || [])
    } catch (e) {
      setRecentLectures([])
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await fetch('/api/subjects', { cache: 'no-store' })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok || !json?.success) throw new Error(json?.error || 'failed')

      const data = json.subjects || []
      setSubjects(data)
    } catch (error) {
      // بيانات تجريبية
      setSubjects([
        {
          id: '1',
          title: 'علم التشريح',
          description: 'دراسة تركيب جسم الإنسان',
          image_url: defaultImages[0],
          icon: '🧬',
          color: 'from-blue-500 to-purple-600',
          is_premium: false,
          order_index: 1,
          lectures_count: 24
        },
        {
          id: '2',
          title: 'علم وظائف الأعضاء',
          description: 'دراسة وظائف الأعضاء',
          image_url: defaultImages[1],
          icon: '🫀',
          color: 'from-red-500 to-pink-600',
          is_premium: true,
          order_index: 2,
          lectures_count: 18
        },
        {
          id: '3',
          title: 'الكيمياء الحيوية',
          description: 'التفاعلات الكيميائية',
          image_url: defaultImages[2],
          icon: '🧪',
          color: 'from-green-500 to-teal-600',
          is_premium: true,
          order_index: 3,
          lectures_count: 22
        },
        {
          id: '4',
          title: 'علم الأمراض',
          description: 'دراسة الأمراض',
          image_url: defaultImages[3],
          icon: '🔬',
          color: 'from-yellow-500 to-orange-600',
          is_premium: false,
          order_index: 4,
          lectures_count: 30
        }
      ])
    }
  }

  const fetchQuickUserStats = async () => {
    try {
      const userDataStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null

      // معدل الإنجاز من /api/student-stats
      try {
        const res = await fetch('/api/student-stats', {
          headers: {
            'Content-Type': 'application/json',
            'x-user-data': userDataStr || ''
          }
        })
        const json = await res.json().catch(() => ({} as any))
        if (res.ok && json?.success && json.stats) {
          setQuickCompletionRate(json.stats.completion_rate || 0)
        } else {
          setQuickCompletionRate(0)
        }
      } catch {
        setQuickCompletionRate(0)
      }

      // عدد الشهادات = عدد الامتحانات التي لدى الطالب فيها محاولة (بدرجة مسجلة)
      try {
        const userId = getCurrentUserId()
        if (!userId) {
          setQuickCertificates(0)
          return
        }
        const res = await fetch(`/api/submit-exam?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({} as any))
        const submissions = Array.isArray(json?.submissions) ? json.submissions : []
        const uniquePassedExams = new Set(
          submissions
            .filter((s: any) => typeof s.score === 'number')
            .map((s: any) => s.exam_id)
        )
        setQuickCertificates(uniquePassedExams.size)
      } catch {
        setQuickCertificates(0)
      }
    } catch {
      setQuickCompletionRate(0)
      setQuickCertificates(0)
    }
  }

  const getCurrentUserId = () => {
    if (user?.id) return user.id
    try {
      const storedUserStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      if (storedUserStr) {
        const storedUser = JSON.parse(storedUserStr)
        return storedUser?.id || null
      }
    } catch {}
    return null
  }

  const loadMessages = async () => {
    const userId = getCurrentUserId()
    if (!userId) return
    try {
      const res = await fetch(`/api/messages?userId=${encodeURIComponent(userId)}&markReadUser=1`, { cache: 'no-store' })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok || !Array.isArray(json.messages)) return
      const mapped = json.messages.map((m: any) => ({
        id: m.id,
        text: m.text,
        sender: m.sender,
        time: new Date(m.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
        read_by_admin: m.read_by_admin,
        read_by_user: m.read_by_user,
      }))
      setMessages(mapped)
    } catch {}
  }

  useEffect(() => {
    if (!showChat) return
    loadMessages()
    const id = setInterval(loadMessages, 3000)
    return () => clearInterval(id)
  }, [showChat])

  useEffect(() => {
    const userId = getCurrentUserId()
    if (!showChat || !userId) {
      setAdminOnline(false)
      setAdminTyping(false)
      if (messagesChannelRef.current) {
        try {
          messagesChannelRef.current.send({ type: 'broadcast', event: 'status', payload: { role: 'user', userId, online: false } })
        } catch {}
        supabase.removeChannel(messagesChannelRef.current)
        messagesChannelRef.current = null
      }
      return
    }

    const channel = supabase.channel(`support-chat-${userId}`, { config: { broadcast: { self: true } } })
    messagesChannelRef.current = channel

    channel
      .on('broadcast', { event: 'status' }, (payload: any) => {
        const data = (payload?.payload || {}) as any
        if (data?.role === 'admin' && data?.userId === userId) {
          setAdminOnline(!!data.online)
        }
      })
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const data = (payload?.payload || {}) as any
        if (data?.role === 'admin' && data?.userId === userId) {
          setAdminTyping(!!data.typing)
        }
      })
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          try {
            channel.send({ type: 'broadcast', event: 'status', payload: { role: 'user', userId, online: true } })
          } catch {}
        }
      })

    return () => {
      setAdminOnline(false)
      setAdminTyping(false)
      if (messagesChannelRef.current) {
        try {
          messagesChannelRef.current.send({ type: 'broadcast', event: 'status', payload: { role: 'user', userId, online: false } })
        } catch {}
        supabase.removeChannel(messagesChannelRef.current)
        messagesChannelRef.current = null
      }
    }
  }, [showChat])

  const sendMessage = async () => {
    if (!chatMessage.trim()) return

    const userId = getCurrentUserId()
    if (!userId) {
      toast.error('يجب تسجيل الدخول لإرسال رسالة')
      return
    }

    const optimisticId = Date.now()
    const optimisticTime = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    const optimisticMessage = {
      id: optimisticId,
      text: chatMessage,
      sender: 'user',
      time: optimisticTime
    }

    setMessages(prev => [...prev, optimisticMessage])

    const textToSend = chatMessage
    setChatMessage('')
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    const userIdForTyping = getCurrentUserId()
    if (userIdForTyping && messagesChannelRef.current) {
      try {
        messagesChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { role: 'user', userId: userIdForTyping, typing: false } })
      } catch {}
    }

    // حفظ الرسالة في قاعدة البيانات
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sender: 'user', text: textToSend })
      })
      const json = await res.json().catch(() => ({} as any))
      if (!res.ok || json?.error) {
        throw new Error(json?.error || 'failed')
      }
      const saved = json.message
      if (saved?.id && saved?.created_at) {
        const serverMessage = {
          id: saved.id,
          text: saved.text,
          sender: saved.sender,
          time: new Date(saved.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
        }
        setMessages(prev => prev.map(m => (m.id === optimisticId ? serverMessage : m)))
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('فشل إرسال الرسالة، حاول مرة أخرى')
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
    }

    // رد تلقائي من الأدمن (مؤقت)
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: 'تم استلام رسالتك، وسيقوم أحمد محرم بالرد عليك في أقرب وقت',
        sender: 'admin',
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      }])
    }, 1000)
  }

  const handleChatChange = (value: string) => {
    setChatMessage(value)
    const userId = getCurrentUserId()
    if (!userId || !messagesChannelRef.current) return
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    try {
      messagesChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { role: 'user', userId, typing: true } })
    } catch {}
    typingTimeoutRef.current = setTimeout(() => {
      try {
        if (!messagesChannelRef.current) return
        messagesChannelRef.current.send({ type: 'broadcast', event: 'typing', payload: { role: 'user', userId, typing: false } })
      } catch {}
    }, 2000)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-black">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/80 backdrop-blur-xl border-b border-gold/20">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded-xl flex items-center justify-center">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-lg font-bold gradient-text">منصة أحمد محرم</h1>
                <p className="text-xs text-white/60">التعليم الطبي المتميز</p>
              </div>
            </div>

            {/* Nav */}
            <nav className="hidden md:flex items-center gap-6">
              <button 
                onClick={() => router.push(`/subjects/${MAIN_SUBJECT_ID}`)}
                className="text-white/70 hover:text-gold transition-colors"
              >
                المواد
              </button>
              <button 
                onClick={() => router.push('/exam')}
                className="text-white/70 hover:text-gold transition-colors"
              >
                الامتحانات
              </button>
            </nav>

            {/* User Menu */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={() => {
                    const next = !showNotifications
                    setShowNotifications(next)
                    if (next) {
                      loadNotifications(true)
                    }
                  }}
                  className="relative p-2 rounded-lg hover:bg-white/10 transition-all"
                >
                  <Bell className="w-5 h-5 text-white/70" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[14px] h-4 px-1 bg-red-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="fixed top-16 right-2 w-[calc(100vw-1rem)] sm:right-4 sm:w-80 max-h-[80vh] overflow-y-auto luxury-card rounded-2xl border border-gold/30 bg-black/95 shadow-xl z-50">
                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bell className="w-4 h-4 text-gold" />
                        <span className="text-sm font-bold text-white">الإشعارات</span>
                      </div>
                      {notificationsLoading && (
                        <span className="text-[11px] text-white/50">جاري التحديث...</span>
                      )}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 && !notificationsLoading && (
                        <div className="px-4 py-6 text-center text-white/50 text-sm">
                          لا توجد إشعارات حالياً
                        </div>
                      )}
                      {notifications.map((n: any) => (
                        <div
                          key={n.id}
                          className={`px-4 py-3 border-b transition-colors ${
                            n.type === 'admin_message'
                              ? 'border-gold/50 bg-gradient-to-r from-gold/10 to-yellow-500/5 hover:bg-gold/15'
                              : 'border-white/5 hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div
                                className={`text-sm font-semibold mb-1 ${
                                  n.type === 'admin_message' ? 'text-gold' : 'text-white'
                                }`}
                              >
                                {n.title}
                              </div>
                              <div
                                className={`text-xs sm:text-sm whitespace-pre-line break-words ${
                                  n.type === 'admin_message' ? 'text-gold/80' : 'text-white/70'
                                }`}
                              >
                                {n.message}
                              </div>
                            </div>
                            <span
                              className={`text-[10px] mt-0.5 ${
                                n.type === 'admin_message' ? 'text-gold/70' : 'text-white/40'
                              }`}
                            >
                              {n.created_at
                                ? new Date(n.created_at).toLocaleDateString('ar-EG', {
                                    month: 'short',
                                    day: 'numeric',
                                  })
                                : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <button 
                onClick={() => setShowProfile(!showProfile)}
                className="w-10 h-10 bg-gradient-to-br from-gold/20 to-yellow-600/20 rounded-full flex items-center justify-center text-gold font-bold"
              >
                {userData?.full_name?.charAt(0) || 'U'}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Profile Dropdown */}
      {showProfile && (
        <div className="fixed top-20 right-4 z-50 luxury-card rounded-2xl p-6 w-72">
          <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
            <div className="w-12 h-12 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-lg">
              {userData?.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <h3 className="font-bold text-white">{userData?.full_name || 'المستخدم'}</h3>
              <p className="text-xs text-white/60">{userData?.email}</p>
            </div>
          </div>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center py-2">
              <span className="text-white/60 text-sm">الحالة</span>
              <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                userData?.subscription_status === 'active' 
                  ? 'bg-green-500/20 text-green-400' 
                  : 'bg-red-500/20 text-red-400'
              }`}>
                {userData?.subscription_status === 'active' ? 'نشط' : 'غير نشط'}
              </span>
            </div>
            {userData?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="w-full py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg font-bold hover:shadow-lg transition-all"
              >
                لوحة الأدمن
              </button>
            )}
          </div>

          <button
            onClick={async () => {
              await signOut()
              router.push('/')
            }}
            className="w-full py-2 bg-red-500/20 text-red-400 rounded-lg font-bold hover:bg-red-500/30 transition-all flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            تسجيل الخروج
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="pt-24 pb-12 px-4 container mx-auto">
        {/* Hero Section */}
        <div className="mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-center"
          >
            <h2 className="text-4xl md:text-5xl font-black gradient-text-animated mb-4">
              مرحباً، {userData?.full_name?.split(' ')[0] || 'طالب'}!
            </h2>
            <p className="text-xl text-white/70">
              ابدأ رحلتك التعليمية واختر المادة التي تريد دراستها
            </p>
          </motion.div>
        </div>

        {/* إحصائيات المشاهدة */}
        {userData?.subscription_status === 'active' && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <BarChart2 className="w-6 h-6 text-gold" />
                <h3 className="text-2xl font-bold text-white">إحصائيات المشاهدة</h3>
              </div>
              <button
                onClick={() => router.push('/dashboard/views')}
                className="text-gold hover:text-yellow-500 flex items-center gap-2 transition-colors"
              >
                عرض التفاصيل
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            <StudentStats />
          </div>
        )}
        
        {/* المواد الدراسية */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">المواد الدراسية</h3>
            <button
              onClick={() => router.push(`/subjects/${MAIN_SUBJECT_ID}`)}
              className="text-gold hover:text-yellow-500 flex items-center gap-2 transition-colors"
            >
              عرض الكل
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
            {subjects.map((subject, index) => (
              <motion.div
                key={subject.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.2 }}
                onClick={() => router.push(`/subjects/${subject.id}`)}
                className="group cursor-pointer"
              >
                <div className="relative h-[28rem] md:h-[30rem] rounded-3xl overflow-hidden luxury-card border-2 border-gold/30 bg-gradient-to-br from-gold/10 via-black/60 to-black shadow-2xl shadow-gold/10 backdrop-blur-xl transition-all duration-500 group-hover:shadow-gold/30 group-hover:border-gold/50 group-hover:-translate-y-1">
                  <div className="absolute inset-0">
                    <img
                      src={subject.image_url}
                      alt={subject.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                    <div className="absolute -inset-[1px] rounded-[inherit] bg-gradient-to-r from-gold/30 to-yellow-500/20 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
                  </div>

                  {subject.is_premium && (
                    <div className="absolute top-4 right-4 bg-gradient-to-r from-gold to-yellow-500 text-black px-3 py-1.5 rounded-full text-xs sm:text-sm font-bold flex items-center gap-1 shadow-md shadow-gold/30">
                      <Crown className="w-4 h-4" />
                      Premium
                    </div>
                  )}

                  <div className="relative h-full flex flex-col justify-end p-6 md:p-7">
                    <div className="text-4xl md:text-5xl mb-3 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{subject.icon}</div>
                    <h4 className="text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors">
                      {subject.title}
                    </h4>
                    <p className="text-white/70 text-base line-clamp-1">
                      {subject.description}
                    </p>
                    <div className="flex items-center gap-2 mt-3 text-white/60 text-sm md:text-base">
                      <Video className="w-4 h-4" />
                      <span>{subject.lectures_count} محاضرة</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* آخر المحاضرات (من صفحة المادة) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">آخر المحاضرات</h3>
            <button
              onClick={() => router.push(`/subjects/${MAIN_SUBJECT_ID}`)}
              className="text-gold hover:text-yellow-500 flex items-center gap-2 transition-colors"
            >
              إدارة المحتوى
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
            {recentLectures.map((lec, index) => (
              <motion.div
                key={lec.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: "easeOut", delay: index * 0.1 }}
                onClick={() => router.push(`/subjects/${MAIN_SUBJECT_ID}`)}
                className="group cursor-pointer"
              >
                <div className="relative h-64 rounded-3xl overflow-hidden luxury-card border-2 border-gold/30 bg-gradient-to-br from-gold/10 via-black/60 to-black shadow-2xl shadow-gold/10 backdrop-blur-xl transition-all duration-500 group-hover:shadow-gold/30 group-hover:border-gold/50 group-hover:-translate-y-1">
                  <div className="absolute inset-0">
                    {lec.thumbnail_url ? (
                      <img src={lec.thumbnail_url} alt={lec.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Video className="w-12 h-12 text-gold/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                  </div>

                  <div className="absolute top-4 right-4 z-10">
                    {lec.is_free ? (
                      <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">مجاني</div>
                    ) : (
                      <div className="bg-gold/20 text-gold px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm">مدفوع</div>
                    )}
                  </div>

                  <div className="relative h-full flex flex-col justify-end p-6">
                    <h4 className="text-xl font-bold text-white mb-1 group-hover:text-gold transition-colors">{lec.title}</h4>
                    <p className="text-white/70 text-sm line-clamp-2">{lec.description}</p>
                    <div className="flex items-center gap-2 mt-2 text-white/60 text-sm">
                      <Clock className="w-4 h-4" />
                      <span>{lec.duration_minutes || 45} دقيقة</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {recentLectures.length === 0 && (
              <div className="text-white/50">لا توجد محاضرات بعد، يمكنك إضافتها من صفحة المادة.</div>
            )}
          </div>
        </div>

        {/* الامتحانات المتاحة (منشورة فقط) */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-white">الامتحانات المتاحة</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10">
            {examsPublished.map((ex: any, index: number) => (
              <motion.div
                key={ex.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: 'easeOut', delay: index * 0.1 }}
                className="group"
              >
                <div className="relative h-56 rounded-3xl overflow-hidden luxury-card border-2 border-gold/30 bg-gradient-to-br from-gold/10 via-black/60 to-black shadow-2xl shadow-gold/10 backdrop-blur-xl transition-all duration-500 group-hover:shadow-gold/30 group-hover:border-gold/50">
                  <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"/>
                  </div>
                  <div className="relative h-full flex flex-col justify-end p-6">
                    <h4 className="text-xl font-bold text-white mb-1 group-hover:text-gold transition-colors">{ex.title}</h4>
                    <div className="flex items-center gap-4 text-white/70 text-sm">
                      <span className="flex items-center gap-1"><Clock className="w-4 h-4"/> {ex.duration_minutes || 60} دقيقة</span>
                      <span className="flex items-center gap-1"><FileText className="w-4 h-4"/> {ex.questions_count || 0} سؤال</span>
                    </div>
                    <div className="flex justify-end mt-3">
                      <button onClick={()=>router.push(`/exam/${ex.id}`)} className="px-4 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold hover:shadow-lg">ابدأ</button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
            {examsPublished.length === 0 && (
              <div className="text-white/50">لا توجد امتحانات متاحة حالياً.</div>
            )}
          </div>
        </div>

        {/* نتيجتك الأخيرة */}
        {latestResult && (
          <div className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white">نتيجتك الأخيرة</h3>
            </div>
            <div className="luxury-card rounded-3xl p-6 border-2 border-gold/30">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h4 className="text-xl font-bold text-white mb-1">{latestResult.examTitle}</h4>
                  <p className="text-white/60 text-sm">التاريخ: {new Date(latestResult.created_at).toLocaleString('ar-EG')}</p>
                  {typeof latestResult.percent === 'number' && typeof latestResult.passThreshold === 'number' && (
                    <div className="mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${latestResult.percent >= latestResult.passThreshold ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                        {latestResult.percent >= latestResult.passThreshold ? 'ناجح' : 'راسب'}
                      </span>
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-3xl font-black text-gold mb-1">
                    {typeof latestResult.score === 'number' && typeof latestResult.total === 'number' ? `${latestResult.score}/${latestResult.total}` : `${latestResult.score ?? '—'}`}
                  </div>
                  {typeof latestResult.percent === 'number' && (
                    <div className="text-white/70 text-sm">{latestResult.percent}%</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.5 }}
            className="luxury-card rounded-2xl p-6 text-center"
          >
            <BookOpen className="w-8 h-8 text-gold mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white">{totalSubjects}</h3>
            <p className="text-gray-400 text-sm">المواد المتاحة</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.7 }}
            className="luxury-card rounded-2xl p-6 text-center"
          >
            <Video className="w-8 h-8 text-gold mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white">{totalLectures}</h3>
            <p className="text-gray-400 text-sm">محاضرة</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="luxury-card rounded-2xl p-6 text-center"
          >
            <Trophy className="w-8 h-8 text-gold mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white">{quickCompletionRate}%</h3>
            <p className="text-gray-400 text-sm">معدل الإنجاز</p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="luxury-card rounded-2xl p-6 text-center"
          >
            <Award className="w-8 h-8 text-gold mx-auto mb-2" />
            <h3 className="text-2xl font-bold text-white">{quickCertificates}</h3>
            <p className="text-gray-400 text-sm">شهادات</p>
          </motion.div>
        </div>
      </main>

      {/* Chat Button */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-gold to-yellow-600 rounded-full flex items-center justify-center text-black shadow-lg hover:shadow-gold/40 hover:scale-110 border border-gold/60 transition-all"
      >
        {showChat ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {/* Chat Window */}
      {showChat && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="fixed bottom-24 right-6 z-50 w-96 h-[500px] luxury-card rounded-3xl overflow-hidden border border-gold/40 bg-gradient-to-br from-black via-zinc-900 to-black shadow-2xl shadow-gold/30"
        >
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-gold to-yellow-500 p-4 border-b border-gold/40">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <Crown className="w-5 h-5 text-black" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-black">أحمد محرم</h3>
                  <p className="text-xs text-black/70">
                    {adminTyping ? 'أحمد محرم يكتب الآن...' : adminOnline ? 'متصل الآن' : 'غير متصل حالياً'}
                  </p>
                </div>
              </div>
          </div>

          {/* Messages */}
          <div className="flex-1 p-4 overflow-y-auto h-[350px] bg-gradient-to-br from-black via-zinc-900 to-black">
            {messages.length === 0 ? (
              <div className="text-center text-white/50 mt-10">
                <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>مرحباً! كيف يمكنني مساعدتك؟</p>
              </div>
            ) : (
              <div className="space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[70%] p-3 rounded-2xl ${
                      msg.sender === 'user' 
                        ? 'bg-gradient-to-r from-gold to-yellow-600 text-black' 
                        : 'bg-black/60 border border-gold/40 text-gold'
                    }`}>
                      <p className="text-[10px] mb-1 opacity-80 font-semibold">
                        {msg.sender === 'user' ? 'أنت' : 'أحمد محرم'}
                      </p>
                      <p className="text-sm">{msg.text}</p>
                      <p className={`text-xs mt-1 ${
                        msg.sender === 'user' ? 'text-black/60' : 'text-white/60'
                      }`}>
                        {msg.time}
                        {msg.sender === 'user' && (
                          <>
                            {' · '}
                            {msg.read_by_admin ? 'شوهد' : 'لم يُقرأ بعد'}
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/10">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={chatMessage}
                    onChange={(e) => handleChatChange(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="اكتب رسالتك..."
                    className="flex-1 px-4 py-2 bg-white/10 border border-white/20 rounded-full text-white placeholder-white/50 focus:border-gold/50 transition-all"
              />
              <button
                onClick={sendMessage}
                className="w-10 h-10 bg-gradient-to-r from-gold to-yellow-600 rounded-full flex items-center justify-center text-black hover:shadow-lg transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
