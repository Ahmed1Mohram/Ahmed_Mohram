'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Shield, 
  Users, 
  Package, 
  CreditCard, 
  Settings, 
  Home, 
  CheckCircle, 
  AlertCircle,
  RefreshCw,
  Database,
  LogOut
} from 'lucide-react'
import { toast } from 'react-hot-toast'

interface User {
  id: string
  email: string
  full_name: string
  role?: string
  created_at?: string
  subscription_status?: string
}

interface Package {
  id: string
  name: string
  price: number
  duration_months: number
  description?: string
}

interface Payment {
  id: string
  user_id: string
  amount: number
  status: string
  created_at: string
}

export default function SuperAdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  const [currentTime, setCurrentTime] = useState('')
  
  // تعيين أذونات المسؤول فوراً عند تحميل الصفحة
  useEffect(() => {
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminOverride', 'true')
    const adminUser = {
      id: 'super-admin',
      email: 'super@admin.com',
      role: 'admin',
      full_name: 'مسؤول النظام الفائق'
    }
    localStorage.setItem('user', JSON.stringify(adminUser))
    
    console.log('🚀 تم تعيين صلاحيات المسؤول الفائق')
    
    // جلب البيانات
    fetchAllData()
    
    // تحديث الوقت كل ثانية
    const updateTime = () => {
      setCurrentTime(new Date().toLocaleTimeString('ar-EG'))
    }
    updateTime()
    const timer = setInterval(updateTime, 1000)
    
    return () => clearInterval(timer)
  }, [])

  const fetchAllData = async () => {
    setLoading(true)
    try {
      const baseUrl = window.location.origin
      
      // جلب المستخدمين
      try {
        const usersRes = await fetch(`${baseUrl}/api/admin/users`)
        if (usersRes.ok) {
          const usersData = await usersRes.json()
          if (usersData.success && usersData.users) {
            setUsers(usersData.users)
            console.log(`✅ تم جلب ${usersData.users.length} مستخدم`)
          }
        }
      } catch (err) {
        console.log('⚠️ فشل جلب المستخدمين:', err)
      }

      // جلب الباقات
      try {
        const packagesRes = await fetch(`${baseUrl}/api/admin/packages`)
        if (packagesRes.ok) {
          const packagesData = await packagesRes.json()
          if (packagesData.packages) {
            setPackages(packagesData.packages)
            console.log(`✅ تم جلب ${packagesData.packages.length} باقة`)
          }
        }
      } catch (err) {
        console.log('⚠️ فشل جلب الباقات:', err)
      }

      // جلب المدفوعات
      try {
        const paymentsRes = await fetch(`${baseUrl}/api/admin/payments`)
        if (paymentsRes.ok) {
          const paymentsData = await paymentsRes.json()
          if (paymentsData.payments) {
            setPayments(paymentsData.payments)
            console.log(`✅ تم جلب ${paymentsData.payments.length} دفعة`)
          }
        }
      } catch (err) {
        console.log('⚠️ فشل جلب المدفوعات:', err)
      }

    } catch (error) {
      console.error('خطأ في جلب البيانات:', error)
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ icon: Icon, title, value, color, desc }: {
    icon: any, title: string, value: string | number, color: string, desc: string
  }) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      className={`bg-gray-900 p-6 rounded-2xl border border-${color}-500/20 hover:border-${color}-500/50 transition-all`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className={`inline-flex p-3 rounded-xl bg-${color}-500/10 mb-3`}>
            <Icon className={`w-6 h-6 text-${color}-400`} />
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{value}</h3>
          <p className="text-gray-300 font-medium">{title}</p>
          <p className="text-gray-500 text-sm mt-1">{desc}</p>
        </div>
      </div>
    </motion.div>
  )

  const TabButton = ({ id, icon: Icon, label, active }: {
    id: string, icon: any, label: string, active: boolean
  }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-gold text-black font-bold' 
          : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5" />
      <span>{label}</span>
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-white">
      {/* رأس الصفحة */}
      <div className="bg-black/50 backdrop-blur border-b border-gold/20 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gold/20 rounded-xl">
                <Shield className="w-8 h-8 text-gold" />
              </div>
              <div>
                <h1 className="text-2xl font-bold gradient-text-gold">المسؤول الفائق</h1>
                <p className="text-gray-400 text-sm">لوحة إدارة مطلقة الصلاحيات</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={fetchAllData}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>تحديث</span>
              </button>
              
              <Link 
                href="/"
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-all"
              >
                <Home className="w-4 h-4" />
                <span>الرئيسية</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {/* الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
          <StatCard 
            icon={Users} 
            title="إجمالي المستخدمين" 
            value={users.length} 
            color="blue"
            desc="المسجلين في النظام"
          />
          <StatCard 
            icon={Package} 
            title="الباقات المتاحة" 
            value={packages.length} 
            color="purple"
            desc="باقات الاشتراك"
          />
          <StatCard 
            icon={CreditCard} 
            title="إجمالي المدفوعات" 
            value={payments.length} 
            color="green"
            desc="العمليات المالية"
          />
          <StatCard 
            icon={CheckCircle} 
            title="الحالة" 
            value="نشط" 
            color="amber"
            desc="النظام يعمل بكفاءة"
          />
        </div>

        {/* أزرار التبويب */}
        <div className="flex flex-wrap gap-4 mb-8">
          <TabButton id="dashboard" icon={Settings} label="لوحة التحكم" active={activeTab === 'dashboard'} />
          <TabButton id="users" icon={Users} label="المستخدمون" active={activeTab === 'users'} />
          <TabButton id="packages" icon={Package} label="الباقات" active={activeTab === 'packages'} />
          <TabButton id="payments" icon={CreditCard} label="المدفوعات" active={activeTab === 'payments'} />
        </div>

        {/* محتوى التبويب */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-900 rounded-2xl border border-gray-700 p-6"
        >
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-gold">مرحباً في لوحة المسؤول الفائق</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">الوصول السريع</h3>
                  
                  <Link href="/admin?force=true" className="block p-4 bg-gold/10 hover:bg-gold/20 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-gold" />
                      <div>
                        <div className="font-medium text-gold">لوحة الإدارة الأصلية</div>
                        <div className="text-sm text-gray-400">مع جميع الميزات المتقدمة</div>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/admin-simple" className="block p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-all">
                    <div className="flex items-center gap-3">
                      <Database className="w-6 h-6 text-blue-400" />
                      <div>
                        <div className="font-medium text-blue-400">الواجهة البسيطة</div>
                        <div className="text-sm text-gray-400">إدارة مبسطة وسريعة</div>
                      </div>
                    </div>
                  </Link>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">معلومات النظام</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-400">حالة النظام</span>
                      <span className="text-green-400 flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        يعمل بشكل طبيعي
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-400">آخر تحديث</span>
                      <span className="text-white">{currentTime || 'جاري التحميل...'}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-800 rounded-lg">
                      <span className="text-gray-400">المستخدم النشط</span>
                      <span className="text-gold">مسؤول النظام الفائق</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-blue-400">إدارة المستخدمين</h2>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-400" />
                  <p className="text-gray-400">جاري تحميل المستخدمين...</p>
                </div>
              ) : users.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400">الاسم</th>
                        <th className="text-left py-3 px-4 text-gray-400">البريد الإلكتروني</th>
                        <th className="text-left py-3 px-4 text-gray-400">الدور</th>
                        <th className="text-left py-3 px-4 text-gray-400">الحالة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-3 px-4 text-white">{user.full_name || 'غير محدد'}</td>
                          <td className="py-3 px-4 text-gray-300">{user.email}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              user.role === 'admin' ? 'bg-gold/20 text-gold' : 'bg-gray-700 text-gray-300'
                            }`}>
                              {user.role === 'admin' ? 'مسؤول' : 'مستخدم'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">
                              نشط
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Users className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>لا توجد بيانات مستخدمين متاحة</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'packages' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-purple-400">إدارة الباقات</h2>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-purple-400" />
                  <p className="text-gray-400">جاري تحميل الباقات...</p>
                </div>
              ) : packages.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="bg-gray-800 p-4 rounded-xl border border-gray-700">
                      <h3 className="text-lg font-bold text-white mb-2">{pkg.name}</h3>
                      <p className="text-2xl font-bold text-purple-400 mb-2">{pkg.price} جنيه</p>
                      <p className="text-gray-400 text-sm mb-3">المدة: {pkg.duration_months} شهر</p>
                      {pkg.description && (
                        <p className="text-gray-300 text-sm">{pkg.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Package className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>لا توجد باقات متاحة</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div>
              <h2 className="text-2xl font-bold mb-6 text-green-400">إدارة المدفوعات</h2>
              {loading ? (
                <div className="text-center py-8">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-green-400" />
                  <p className="text-gray-400">جاري تحميل المدفوعات...</p>
                </div>
              ) : payments.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400">المبلغ</th>
                        <th className="text-left py-3 px-4 text-gray-400">الحالة</th>
                        <th className="text-left py-3 px-4 text-gray-400">التاريخ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr key={payment.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                          <td className="py-3 px-4 text-white font-bold">{payment.amount} جنيه</td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded text-xs ${
                              payment.status === 'completed' 
                                ? 'bg-green-500/20 text-green-400' 
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}>
                              {payment.status === 'completed' ? 'مكتمل' : 'معلق'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-300">
                            {new Date(payment.created_at).toLocaleDateString('ar-EG')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CreditCard className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>لا توجد مدفوعات مسجلة</p>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
