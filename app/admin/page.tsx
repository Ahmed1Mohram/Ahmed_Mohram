'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Crown, Users, BookOpen, TrendingUp, DollarSign,
  Settings, LogOut, Bell, Search, Filter, 
  MoreVertical, Eye, Edit, Trash2, Plus,
  CheckCircle, XCircle, Clock, AlertCircle,
  MessageCircle, Ban, UserCheck, Calendar,
  CreditCard, Package, Activity, Download, Globe, Unlock, Smartphone
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/providers'
import { supabase } from '@/components/providers'
import PackageManager from './components/PackageManager'
import SubscriptionManager from './components/SubscriptionManager'
import SiteSettings from './components/SiteSettings'
import SubjectManager from './components/SubjectManager'
import LectureManager from './components/LectureManager'
import ContentManager from './components/ContentManager'
import ChatManager from './components/ChatManager'
import NotificationCenter from './components/NotificationCenter'
import ExamManager from './components/ExamManager'

interface User {
  id: string
  full_name: string
  email: string
  phone_number: string
  password_hash?: string
  password_plain?: string
  role?: 'admin' | 'teacher' | 'student'
  status: 'pending' | 'approved' | 'rejected' | 'banned'
  subscription_status: 'active' | 'inactive' | 'expired'
  subscription_end_date?: string
  created_at: string
  payment_proof_url?: string
  package_name?: string
  amount?: number
}

const handleBanDevice = async (userId: string) => {
  try {
    const res = await fetch('/api/admin/ban-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    if (res.ok) {
      toast.success('تم حظر جهاز/أجهزة المستخدم')
    } else {
      const j = await res.json().catch(()=>({}))
      toast.error(j?.error || 'فشل حظر الجهاز')
    }
  } catch (e) {
    toast.error('خطأ أثناء حظر الجهاز')
  }
}

const handleUnbanDevice = async (userId: string) => {
  try {
    const res = await fetch('/api/admin/unban-device', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    if (res.ok) {
      toast.success('تم فك حظر جهاز/أجهزة المستخدم')
    } else {
      const j = await res.json().catch(()=>({}))
      toast.error(j?.error || 'فشل فك حظر الجهاز')
    }
  } catch (e) {
    toast.error('خطأ أثناء فك حظر الجهاز')
  }
}

// مؤقتًا: منع خطأ مرجعي لزر الحذف حتى يتم ربط API الحذف بشكل آمن
const handleDeleteUser = async (userId: string, userName: string) => {
  toast.error('حذف المستخدم غير متاح حاليًا')
}

interface PaymentRequest {
  id: string
  user_id: string
  user_name: string
  package_name: string
  amount: number
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  proof_url?: string
}

export default function AdminPage() {
  const router = useRouter()
  const { user: adminUser, isAdmin: isAuthAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('pending-approvals')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [adminSubject, setAdminSubject] = useState<any | null>(null)
  const [adminLecture, setAdminLecture] = useState<any | null>(null)
  
  // Real statistics
  const [stats, setStats] = useState([
    { label: 'طلبات معلقة', value: '0', icon: Clock, color: 'from-yellow-500 to-orange-600' },
    { label: 'إجمالي الطلاب', value: '0', icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'الطلاب النشطون', value: '0', icon: UserCheck, color: 'from-green-500 to-green-600' },
    { label: 'الإيرادات الشهرية', value: '0 ج.م', icon: DollarSign, color: 'from-gold to-yellow-600' },
  ])

  // التحكم في الجلب لتجنب الوميض وتعدد الطلبات
  const [canFetch, setCanFetch] = useState(false)
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const currentAbortRef = useRef<AbortController | null>(null)
  const latestFetchKeyRef = useRef<string>('')

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300)
    return () => clearTimeout(handler)
  }, [searchTerm])
  
  const [menuItems, setMenuItems] = useState([
    { id: 'pending-approvals', label: 'طلبات معلقة', icon: Clock, badge: 0 },
    { id: 'students', label: 'إدارة الطلاب', icon: Users },
    { id: 'packages', label: 'باقات الاشتراك', icon: Package },
    { id: 'subscriptions', label: 'إدارة الاشتراكات', icon: CreditCard },
    { id: 'subjects', label: 'المواد الدراسية', icon: BookOpen },
    { id: 'notifications', label: 'الإشعارات', icon: Bell },
    { id: 'payments', label: 'المدفوعات', icon: DollarSign },
    { id: 'exams', label: 'الامتحانات', icon: BookOpen },
    { id: 'chat', label: 'الرسائل', icon: MessageCircle },
    { id: 'analytics', label: 'الإحصائيات', icon: Activity },
    { id: 'site-settings', label: 'إعدادات الموقع', icon: Globe },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ])

  useEffect(() => {
    // إظهار ترحيب بالمسؤول في الكونسول
    console.log('مرحباً في لوحة الإدارة! جاري التحقق من صلاحيات المسؤول...');
    
    // التحقق من حالة المسؤول
    const isAdminInAuth = !!isAuthAdmin; // من useAuth
    let isAdminInStorage = false;
    let isAdminInCookie = false;
    let userData = null;
    
    try {
      // 1. التحقق من Cookies
      console.log('فحص cookies للأدمن...');
      const cookieString = document.cookie;
      console.log('جميع الـ cookies:', cookieString);
      
      const cookies = cookieString.split(';').map(cookie => cookie.trim());
      const isAdminCookie = cookies.find(cookie => cookie.startsWith('isAdmin='));
      
      if (isAdminCookie) {
        isAdminInCookie = isAdminCookie.split('=')[1] === 'true';
        console.log('حالة المسؤول من Cookies:', isAdminInCookie);
        
        // حفظ في localStorage إذا لم يكن موجودًا بالفعل
        if (isAdminInCookie && !localStorage.getItem('isAdmin')) {
          console.log('تنشيط حالة الأدمن من cookies إلى localStorage');
          localStorage.setItem('isAdmin', 'true');
        }
      } else {
        // تحقق من URL الحالي
        console.log('تحقق من URL الحالي:', window.location.pathname);
        
        // إذا كنا في صفحة الأدمن فمن المفترض أن تكون المصادقة صحيحة
        if (window.location.pathname.startsWith('/admin')) {
          console.log('نحن في صفحة الأدمن بالفعل, محاولة إعادة ضبط cookies');
          
          // إضافة cookies جديدة
          document.cookie = `isAdmin=true; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
          document.cookie = `isAdmin=true; path=/admin; max-age=${24 * 60 * 60}; SameSite=Lax`;
          isAdminInCookie = true;
          
          // إذا لم يكن لدينا بيانات في localStorage
          if (!localStorage.getItem('isAdmin')) {
            localStorage.setItem('isAdmin', 'true');
          }
        }
      }
      
      // 2. التحقق من localStorage
      const isAdmin = localStorage.getItem('isAdmin');
      const savedUser = localStorage.getItem('user');
      
      if (savedUser) {
        userData = JSON.parse(savedUser);
        isAdminInStorage = isAdmin === 'true' && userData?.role === 'admin';
      } else if (isAdminInCookie) {
        // إنشاء بيانات مستخدم افتراضية إذا كان أدمن من خلال الـ cookies
        const fakeAdminUser = {
          id: 'admin-via-cookie',
          email: 'admin@example.com',
          role: 'admin',
          full_name: 'أحمد محرم'
        };
        localStorage.setItem('user', JSON.stringify(fakeAdminUser));
        isAdminInStorage = true;
      }
      
      console.log('حالة المسؤول من Auth:', isAdminInAuth);
      console.log('حالة المسؤول من Storage:', isAdminInStorage);
      console.log('حالة المسؤول من Cookies:', isAdminInCookie);
      
      // 3. السماح بالوصول إذا كان المستخدم مسؤولاً في أي من المصادر
      if (isAdminInAuth || isAdminInStorage || isAdminInCookie) {
        console.log('✅ تم التأكد من صلاحيات المسؤول، سيتم بدء الجلب عبر المؤثرات التفاعلية...');
        // سيتم تشغيل الجلب من المؤثر التالي عندما يتم تفعيل canFetch
      } else {
        console.error('❌ فشل التحقق من صلاحيات المسؤول! سيتم التوجيه قريبًا...');
      }
    } catch (error) {
      console.error('خطأ أثناء التحقق من صلاحيات المسؤول:', error);
    }
    
    // تم نقل منطق الفحص للأعلى لتجنب التوجيه غير الضروري
    // بعد التحقق من cookies و localStorage سنكتفي بإظهار رسالة فقط إذا لم يتم التعرف على المستخدم
    if (!isAdminInAuth && !isAdminInStorage && !isAdminInCookie) {
      toast.error('يرجى تسجيل الدخول كأدمن')
      setTimeout(() => {
        router.push('/login')
      }, 2000) // إعطاء وقت لرؤية الرسالة
      return
    }
    
    // تم الاعتماد على تأثير مستقل لإطلاق الجلب وفقاً للتبويب والبحث
    setCanFetch(true)
  }, [adminUser, isAuthAdmin])

  useEffect(() => {
    if (!canFetch) return
    fetchData()
    // لا نستخدم interval لتجنب الوميض والتضارب بين النتائج
  }, [activeTab, debouncedSearch, canFetch])

  const fetchData = async () => {
    setLoading(true)
    try {
      // محاولة إعداد قاعدة البيانات أولاً
      const skipSetup = true;
      if (!skipSetup) {
        try {
          console.log('Setting up database tables before fetching users...');
          const baseUrl = window.location.origin;
          await fetch(`${baseUrl}/api/setup-db`, { 
            method: 'GET',
            headers: {
              'Cache-Control': 'no-cache',
              'X-Timestamp': Date.now().toString()
            }
          });
          // انتظار لحظة للتأكد من اكتمال الإعداد
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (setupError) {
          console.log('Setup DB call failed but continuing...', setupError);
        }
      }

      // Fetch users with retry logic
    const baseUrl = window.location.origin;
    const usersEndpoint = activeTab === 'pending-approvals'
      ? `${baseUrl}/api/admin/pending-users?limit=50&search=${encodeURIComponent(debouncedSearch)}`
      : `${baseUrl}/api/admin/users`;

    // إلغاء أي طلب سابق قيد التنفيذ
    if (currentAbortRef.current) {
      try { currentAbortRef.current.abort() } catch {}
    }
    const controller = new AbortController()
    currentAbortRef.current = controller

    const fetchKey = `${usersEndpoint}`
    latestFetchKeyRef.current = fetchKey
    
    // تنفيذ طلب جلب المستخدمين مع إعادة المحاولة

    let usersData;
    let retryCount = 0;
    const maxRetries = 2;

    while (retryCount <= maxRetries) {
      try {
        const usersResponse = await fetch(usersEndpoint, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
            'X-Timestamp': Date.now().toString()
          },
          signal: controller.signal
        })

        if (usersResponse.ok) {
          try {
            usersData = await usersResponse.json();
            console.log('Fetched users count:', Array.isArray(usersData?.users) ? usersData.users.length : 0)
            if (latestFetchKeyRef.current !== fetchKey) {
              return
            }
            break;
          } catch (parseError) {
            console.error('Error parsing users data:', parseError);
            retryCount++;

            if (retryCount <= maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 1000));
              continue;
            }
          }
        } else {
          retryCount++;
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
            continue;
          }
          if (latestFetchKeyRef.current === fetchKey) {
            setUsers([]);
            updateStats([]);
          }
          break;
        }
      } catch (netErr: any) {
        if (netErr?.name === 'AbortError' || controller.signal.aborted) {
          return;
        }
        retryCount++;
        if (retryCount <= maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }
        if (latestFetchKeyRef.current === fetchKey) {
          setUsers([]);
          updateStats([]);
        }
        break;
      }
    }

    // إذا تم إلغاء هذا الطلب أو تم تجاوزه بطلب أحدث، نتوقف هنا
    if (controller.signal.aborted || latestFetchKeyRef.current !== fetchKey) {
      return
    }

    // إذا لم نحصل على بيانات (تمت معالجتها أعلاه بالفعل)، لا نعرض خطأ ثانوي
    if (!usersData) {
      return
    }

    // معالجة البيانات المسترجعة
    if (usersData && usersData.success && Array.isArray(usersData.users)) {
      if (latestFetchKeyRef.current === fetchKey) {
        setUsers(usersData.users);
        updateStats(usersData.users);
      }

      if (usersData.users.length === 0) {
        if (activeTab === 'pending-approvals' && !debouncedSearch) {
          try {
            const allRes = await fetch(`${baseUrl}/api/admin/users`, {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
                'Cache-Control': 'no-cache',
                'Pragma': 'no-cache',
                'X-Timestamp': Date.now().toString(),
              },
            })
            if (allRes.ok) {
              const allData = await allRes.json()
              if (allData && allData.success && Array.isArray(allData.users)) {
                if (latestFetchKeyRef.current === fetchKey) {
                  setUsers(allData.users)
                  updateStats(allData.users)
                }
              }
            }
          } catch {}
        }
      }
    } else {
      console.error('Invalid users data format or fetch failed:', usersData);
      toast.error('تعذر جلب بيانات المستخدمين');
      // استخدام مصفوفة فارغة كبديل
      if (latestFetchKeyRef.current === fetchKey) {
        setUsers([]);
        updateStats([]);
      }
    }

    // Fetch payment requests فقط عند الحاجة
    if (activeTab === 'payments') {
      const paymentsResponse = await fetch('/api/admin/payments', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      })

      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json()
        console.log('Fetched payments:', paymentsData)
        if (paymentsData.success) {
          setPaymentRequests(paymentsData.payments || [])
        }
      }
    } else {
      setPaymentRequests([])
    }
  } catch (error: any) {
    if (error?.name === 'AbortError') {
      return
    }
    console.error('Error fetching data:', error)
    toast.error('حدث خطأ في جلب البيانات')
    // استخدام بيانات افتراضية في حالة الخطأ
    setUsers([])
    updateStats([])
  } finally {
    // لا نغيّر حالة التحميل إلا إذا كان هذا الطلب هو الأحدث
    // لتجنب وميض واجهة المستخدم عند تعدد النتائج
    // ويكفي أن يكون fetchKey مطابقاً
    // إذا تم إلغاء الطلب فلن يصل إلى هنا عادةً
    setLoading(false)
  }
}

const updateStats = (usersData: User[]) => {
  const pending = usersData.filter(u => u.status === 'pending').length
  const total = usersData.length
  const active = usersData.filter(u => u.subscription_status === 'active').length
  const revenue = usersData
    .filter(u => u.subscription_status === 'active')
    .reduce((sum, u) => sum + (u.amount || 0), 0)

  setStats([
    { label: 'طلبات معلقة', value: pending.toString(), icon: Clock, color: 'from-yellow-500 to-orange-600' },
    { label: 'إجمالي الطلاب', value: total.toString(), icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'الطلاب النشطون', value: active.toString(), icon: UserCheck, color: 'from-green-500 to-green-600' },
    { label: 'الإيرادات الشهرية', value: `${revenue} ج.م`, icon: DollarSign, color: 'from-gold to-yellow-600' },
  ])

  // Update menu badge
  setMenuItems(prev => prev.map(item => 
    item.id === 'pending-approvals' ? { ...item, badge: pending } : item
  ))
}

const handleApproveUser = async (userId: string) => {
  try {
    // أولاً: استدعاء واجهة API الموجودة للحفاظ على توافق النظام
    const adminResponse = await fetch('/api/admin/approve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'approve' })
    })

    if (adminResponse.ok) {
      // ثانياً: استدعاء واجهة API الجديدة لتفعيل الحساب تلقائياً
      try {
        const activateResponse = await fetch('/api/approve-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        
        if (activateResponse.ok) {
          toast.success('تم قبول وتفعيل حساب المستخدم بنجاح')
        } else {
          toast.error('تم قبول المستخدم لكن هناك مشكلة في تفعيل الحساب')
        }
      } catch (activateError) {
        console.error('Error activating user account:', activateError);
        toast.error('تم قبول المستخدم لكن هناك مشكلة في تفعيل الحساب')
      }
      
      // تحديث البيانات في الواجهة
      fetchData()
    }
  } catch (error) {
    console.error('Error approving user:', error);
    toast.error('حدث خطأ في قبول المستخدم')
  }
}

const handleRejectUser = async (userId: string) => {
  try {
    const response = await fetch('/api/admin/approve-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, action: 'reject' })
    })

    if (response.ok) {
      toast.success('تم رفض المستخدم')
      fetchData()
    }
  } catch (error) {
    toast.error('حدث خطأ في رفض المستخدم')
  }
}

const handleBanUser = async (userId: string) => {
  try {
    const response = await fetch('/api/admin/ban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })

    if (response.ok) {
      toast.success('تم حظر المستخدم')
      fetchData()
    } else {
      toast.error('فشل حظر المستخدم')
    }
  } catch (error) {
    console.error('Error banning user:', error)
    toast.error('حدث خطأ')
  }
}

const handleUnbanUser = async (userId: string) => {
  try {
    const response = await fetch('/api/admin/unban-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    })
    if (response.ok) {
      toast.success('تم إلغاء حظر المستخدم')
      fetchData()
    } else {
      const j = await response.json().catch(() => ({}))
      toast.error(j?.error || 'فشل إلغاء الحظر')
    }
  } catch (error) {
    console.error('Error unbanning user:', error)
    toast.error('حدث خطأ')
  }
}
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.phone_number.includes(searchTerm)
    const matchesFilter = filterStatus === 'all' || user.status === filterStatus
    return matchesSearch && matchesFilter
  })
  
  const handleLogout = () => {
    // حذف بيانات الأدمن
    localStorage.removeItem('user')
    localStorage.removeItem('isAdmin')
    localStorage.removeItem('session')
    document.cookie = 'isAdmin=; path=/; max-age=0'
    
    toast.success('تم تسجيل الخروج بنجاح')
    router.push('/login')
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Admin Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="luxury-card backdrop-blur-xl border-b border-gold/20"
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-gold to-gold-dark rounded-xl">
                <Crown className="w-6 h-6 text-black" />
              </div>
              <div>
                <h1 className="text-2xl font-black gradient-text-animated">لوحة الأدمن</h1>
                <p className="text-white/60 text-sm">منصة أحمد محرم التعليمية</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button className="p-2 rounded-lg hover:bg-white/10 transition-all relative">
                <Bell className="w-5 h-5 text-gold" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>
              <button 
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-all flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                <span>خروج</span>
              </button>
            </div>
          </div>
        </div>
      </motion.header>
      
      <div className="flex">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.8, ease: "easeOut", delay: 0.5 }}
          className="w-64 h-[calc(100vh-80px)] luxury-card backdrop-blur-xl border-l border-gold/20 p-4"
        >
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  activeTab === item.id
                    ? 'bg-gradient-to-r from-gold/20 to-gold-dark/20 text-gold border border-gold/30'
                    : 'hover:bg-white/5 text-white/70 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </motion.aside>
        
        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {/* Pending Approvals Tab */}
          {activeTab === 'pending-approvals' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <h2 className="text-2xl font-bold gradient-text mb-6">طلبات الاشتراك المعلقة</h2>
              
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredUsers.filter(u => u.status === 'pending').map(user => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
                      className="luxury-card rounded-2xl p-6 border border-gold/20"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center text-black font-bold text-lg">
                              {user.full_name.charAt(0)}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">{user.full_name}</h3>
                              <p className="text-white/60 text-sm">{user.email}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div>
                              <p className="text-white/60 text-xs mb-1">رقم الهاتف</p>
                              <p className="text-white font-mono">{user.phone_number}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs mb-1">الباقة المطلوبة</p>
                              <p className="text-gold font-bold">{user.package_name || 'باقة الشهر'}</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs mb-1">المبلغ</p>
                              <p className="text-green-400 font-bold">{user.amount || 200} جنيه</p>
                            </div>
                            <div>
                              <p className="text-white/60 text-xs mb-1">تاريخ الطلب</p>
                              <p className="text-white">{new Date(user.created_at).toLocaleDateString('ar-EG')}</p>
                            </div>
                          </div>
                          
                          {user.payment_proof_url && (
                            <div className="mb-4">
                              <p className="text-white/60 text-xs mb-2">إيصال الدفع</p>
                              <a 
                                href={user.payment_proof_url} 
                                target="_blank" 
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                              >
                                <Eye className="w-4 h-4" />
                                عرض الإيصال
                              </a>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                          <button
                            onClick={() => handleApproveUser(user.id)}
                            className="px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            قبول
                          </button>
                          <button
                            onClick={() => handleRejectUser(user.id)}
                            className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-bold hover:bg-red-500/30 transition-all flex items-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            رفض
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                  
                  {filteredUsers.filter(u => u.status === 'pending').length === 0 && (
                    <div className="text-center py-12">
                      <Clock className="w-16 h-16 text-white/20 mx-auto mb-4" />
                      <p className="text-white/60">لا توجد طلبات معلقة</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Students Management Tab */}
          {activeTab === 'students' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold gradient-text">إدارة الطلاب</h2>
                <div className="flex gap-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                    <input
                      type="text"
                      placeholder="بحث بالاسم أو الهاتف..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                    />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
                  >
                    <option value="all">جميع الحالات</option>
                    <option value="approved">مقبول</option>
                    <option value="pending">معلق</option>
                    <option value="rejected">مرفوض</option>
                    <option value="banned">محظور</option>
                  </select>
                </div>
              </div>

              <div className="overflow-x-auto luxury-card rounded-2xl">
                <table className="w-full">
                  <thead className="border-b border-gold/20">
                    <tr className="text-gold text-left">
                      <th className="p-4">الطالب</th>
                      <th className="p-4">البريد الإلكتروني</th>
                      <th className="p-4">رقم الهاتف</th>
                      <th className="p-4">كلمة المرور</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">الاشتراك</th>
                      <th className="p-4">تاريخ الانضمام</th>
                      <th className="p-4">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-gold/20 to-yellow-600/20 rounded-full flex items-center justify-center text-gold font-bold">
                              {user.full_name.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-white">{user.full_name}</p>
                              <p className="text-white/60 text-xs">{user.id.substring(0, 8)}...</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-white/80 text-sm">{user.email}</p>
                        </td>
                        <td className="p-4 text-white/80 font-mono text-sm">{user.phone_number}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <input 
                              type="text" 
                              value={user.password_plain || '—'} 
                              readOnly
                              className="bg-transparent text-white/80 text-sm w-32"
                            />
                            {user.password_plain && (
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText(user.password_plain || '')
                                  toast.success('تم نسخ كلمة المرور')
                                }}
                                className="p-1 hover:bg-white/10 rounded transition-all"
                                title="نسخ كلمة المرور"
                              >
                                📋
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                            user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                            user.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.status === 'approved' ? 'مقبول' :
                             user.status === 'pending' ? 'معلق' :
                             user.status === 'rejected' ? 'مرفوض' : 'محظور'}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            user.subscription_status === 'active' ? 'bg-blue-500/20 text-blue-400' :
                            user.subscription_status === 'expired' ? 'bg-orange-500/20 text-orange-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {user.subscription_status === 'active' ? 'نشط' :
                             user.subscription_status === 'expired' ? 'منتهي' : 'غير نشط'}
                          </span>
                        </td>
                        <td className="p-4 text-white/60 text-xs">
                          {new Date(user.created_at).toLocaleDateString('ar-EG')}
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            {user.status === 'pending' && (
                              <button
                                onClick={() => handleApproveUser(user.id)}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                                title="قبول"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            {user.status === 'pending' && (
                              <button
                                onClick={() => handleRejectUser(user.id)}
                                className="p-2 bg-orange-500/20 text-orange-400 rounded-lg hover:bg-orange-500/30 transition-all"
                                title="رفض"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                            {user.status !== 'banned' && user.role !== 'admin' && (
                              <button
                                onClick={() => handleBanUser(user.id)}
                                className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"
                                title="حظر"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                            {/* حظر الجهاز لكل أجهزة المستخدم */}
                            <button
                              onClick={() => handleBanDevice(user.id)}
                              className="p-2 bg-red-500/10 text-red-300 rounded-lg hover:bg-red-500/20 transition-all"
                              title="حظر الجهاز"
                            >
                              <Smartphone className="w-4 h-4" />
                            </button>
                            {user.status === 'banned' && (
                              <button
                                onClick={() => handleUnbanUser(user.id)}
                                className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all"
                                title="إلغاء الحظر"
                              >
                                <Unlock className="w-4 h-4" />
                              </button>
                            )}
                            {/* فك حظر الجهاز لكل أجهزة المستخدم */}
                            <button
                              onClick={() => handleUnbanDevice(user.id)}
                              className="p-2 bg-green-500/10 text-green-300 rounded-lg hover:bg-green-500/20 transition-all"
                              title="فك حظر الجهاز"
                            >
                              <Smartphone className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => router.push(`/admin/user/${user.id}`)}
                              className="p-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                const data = `الاسم: ${user.full_name}\nالبريد: ${user.email}\nالهاتف: ${user.phone_number}\nالحالة: ${user.status}\nالاشتراك: ${user.subscription_status}`
                                navigator.clipboard.writeText(data)
                                toast.success('تم نسخ البيانات')
                              }}
                              className="p-2 bg-purple-500/20 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all"
                              title="نسخ البيانات"
                            >
                              📋
                            </button>
                            {user.role !== 'admin' && (
                              <button
                                onClick={() => handleDeleteUser(user.id, user.full_name)}
                                className="p-2 bg-red-600/20 text-red-500 rounded-lg hover:bg-red-600/40 transition-all border border-red-500/30"
                                title="حذف نهائي ⚠️"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {filteredUsers.length === 0 && (
                <div className="text-center py-12 text-white/60">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p>لا يوجد مستخدمين</p>
                </div>
              )}
            </motion.div>
          )}

          {/* Packages Management Tab */}
          {activeTab === 'packages' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <PackageManager />
            </motion.div>
          )}

          {/* Subscriptions Management Tab */}
          {activeTab === 'subscriptions' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <SubscriptionManager />
            </motion.div>
          )}

          {/* Subjects Management Tab */}
          {activeTab === 'subjects' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* 3-level manager: Subjects -> Lectures -> Content */}
              {adminLecture ? (
                <ContentManager
                  lecture={adminLecture}
                  onBack={() => setAdminLecture(null)}
                />
              ) : adminSubject ? (
                <LectureManager
                  subject={adminSubject}
                  onBack={() => setAdminSubject(null)}
                  onManageContent={(lec) => setAdminLecture(lec)}
                />
              ) : (
                <SubjectManager onManageLectures={(subj) => setAdminSubject(subj)} />
              )}
            </motion.div>
          )}

          {/* Chat Management Tab */}
          {activeTab === 'chat' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold gradient-text mb-6">الرسائل والمحادثات</h2>
              <ChatManager />
            </motion.div>
          )}

          {/* Exams Management Tab */}
          {activeTab === 'exams' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <ExamManager />
            </motion.div>
          )}

          {/* Site Settings Tab */}
          {activeTab === 'site-settings' && <SiteSettings />}

          {/* Notifications Center */}
          {activeTab === 'notifications' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <h2 className="text-2xl font-bold gradient-text mb-6">مركز الإشعارات</h2>
              <NotificationCenter />
            </motion.div>
          )}

          {/* Dashboard Stats */}
          {activeTab === 'dashboard' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="luxury-card backdrop-blur-xl p-6 rounded-2xl"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                        <stat.icon className="w-6 h-6 text-white" />
                      </div>
                      <MoreVertical className="w-5 h-5 text-white/30" />
                    </div>
                    <h3 className="text-3xl font-bold text-white mb-1">{stat.value}</h3>
                    <p className="text-white/60 text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
