'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  Crown, Users, BookOpen, TrendingUp, DollarSign,
  Settings, LogOut, Bell, Search, Filter, 
  MoreVertical, Eye, Edit, Trash2, Plus,
  CheckCircle, XCircle, Clock, AlertCircle,
  MessageCircle, Ban, UserCheck, Calendar,
  CreditCard, Package, Activity, Download
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/providers'

interface User {
  id: string
  full_name: string
  email: string
  phone_number: string
  status: 'pending' | 'approved' | 'rejected' | 'banned'
  subscription_status: 'active' | 'inactive' | 'expired'
  subscription_end_date?: string
  created_at: string
  payment_proof_url?: string
  package_name?: string
  amount?: number
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
  const { user: adminUser } = useAuth()
  const [activeTab, setActiveTab] = useState('pending-approvals')
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<User[]>([])
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  
  // Real statistics
  const [stats, setStats] = useState([
    { label: 'طلبات معلقة', value: '0', icon: Clock, color: 'from-yellow-500 to-orange-600' },
    { label: 'إجمالي الطلاب', value: '0', icon: Users, color: 'from-blue-500 to-blue-600' },
    { label: 'الطلاب النشطون', value: '0', icon: UserCheck, color: 'from-green-500 to-green-600' },
    { label: 'الإيرادات الشهرية', value: '0 ج.م', icon: DollarSign, color: 'from-gold to-yellow-600' },
  ])
  
  const menuItems = [
    { id: 'pending-approvals', label: 'طلبات معلقة', icon: Clock, badge: 0 },
    { id: 'students', label: 'إدارة الطلاب', icon: Users },
    { id: 'payments', label: 'المدفوعات', icon: CreditCard },
    { id: 'courses', label: 'المحاضرات', icon: BookOpen },
    { id: 'analytics', label: 'الإحصائيات', icon: Activity },
    { id: 'settings', label: 'الإعدادات', icon: Settings },
  ]

  useEffect(() => {
    // Check if user is admin
    if (adminUser && adminUser.role !== 'admin') {
      toast.error('غير مصرح لك بالدخول')
      router.push('/dashboard')
      return
    }
    
    fetchData()
    // Refresh data every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch users
      const usersResponse = await fetch('/api/admin/users')
      const usersData = await usersResponse.json()
      if (usersData.success) {
        setUsers(usersData.users || [])
        updateStats(usersData.users || [])
      }

      // Fetch payment requests
      const paymentsResponse = await fetch('/api/admin/payments')
      const paymentsData = await paymentsResponse.json()
      if (paymentsData.success) {
        setPaymentRequests(paymentsData.payments || [])
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
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
    menuItems[0].badge = pending
  }

  const handleApproveUser = async (userId: string) => {
    try {
      const response = await fetch('/api/admin/approve-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'approve' })
      })

      if (response.ok) {
        toast.success('تم قبول المستخدم بنجاح')
        fetchData()
      }
    } catch (error) {
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
      }
    } catch (error) {
      toast.error('حدث خطأ في حظر المستخدم')
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
    toast.success('تم تسجيل الخروج بنجاح')
    router.push('/login')
  }
  
  return (
    <div className="min-h-screen bg-black">
      {/* Admin Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
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
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-64 h-[calc(100vh-80px)] luxury-card backdrop-blur-xl border-l border-gold/20 p-4"
        >
          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full px-4 py-3 rounded-xl flex items-center gap-3 transition-all ${
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="luxury-card rounded-2xl p-6 border border-gold/20"
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
              
              {/* Recent Students Table */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="luxury-card backdrop-blur-xl rounded-2xl p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold gradient-text">الطلاب الجدد</h2>
                  <button className="btn-primary text-sm">
                    <Plus className="w-4 h-4 ml-2" />
                    إضافة طالب
                  </button>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gold/20">
                        <th className="text-right pb-3 text-gold/80 font-medium">الاسم</th>
                        <th className="text-right pb-3 text-gold/80 font-medium">البريد الإلكتروني</th>
                        <th className="text-right pb-3 text-gold/80 font-medium">الحالة</th>
                        <th className="text-right pb-3 text-gold/80 font-medium">تاريخ الانضمام</th>
                        <th className="text-right pb-3 text-gold/80 font-medium">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {recentStudents.map((student) => (
                        <tr key={student.id} className="hover:bg-white/5 transition-colors">
                          <td className="py-4 text-white">{student.name}</td>
                          <td className="py-4 text-white/70">{student.email}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                              student.status === 'active'
                                ? 'bg-green-500/20 text-green-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {student.status === 'active' ? 'نشط' : 'معلق'}
                            </span>
                          </td>
                          <td className="py-4 text-white/70">{student.joinDate}</td>
                          <td className="py-4">
                            <div className="flex items-center gap-2">
                              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <Eye className="w-4 h-4 text-gold" />
                              </button>
                              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <Edit className="w-4 h-4 text-blue-400" />
                              </button>
                              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                                <Trash2 className="w-4 h-4 text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </>
          )}
          
          {activeTab === 'students' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="luxury-card backdrop-blur-xl rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold gradient-text mb-4">إدارة الطلاب</h2>
              <p className="text-white/60">قسم إدارة الطلاب قيد التطوير...</p>
            </motion.div>
          )}
          
          {activeTab === 'courses' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="luxury-card backdrop-blur-xl rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold gradient-text mb-4">إدارة الدورات</h2>
              <p className="text-white/60">قسم إدارة الدورات قيد التطوير...</p>
            </motion.div>
          )}
          
          {activeTab === 'payments' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="luxury-card backdrop-blur-xl rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold gradient-text mb-4">إدارة المدفوعات</h2>
              <p className="text-white/60">قسم إدارة المدفوعات قيد التطوير...</p>
            </motion.div>
          )}
          
          {activeTab === 'settings' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="luxury-card backdrop-blur-xl rounded-2xl p-6"
            >
              <h2 className="text-2xl font-bold gradient-text mb-4">الإعدادات</h2>
              <p className="text-white/60">قسم الإعدادات قيد التطوير...</p>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  )
}