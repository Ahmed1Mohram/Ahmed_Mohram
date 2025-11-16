'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Shield, Settings, Users, Package, CreditCard, AlertCircle, LogOut } from 'lucide-react'

// مكون البطاقة الإحصائية
const StatCard = ({ icon: Icon, title, value, color }: { icon: any, title: string, value: string, color: string }) => (
  <motion.div
    whileHover={{ y: -5, scale: 1.02 }}
    className={`bg-black rounded-2xl p-6 border border-${color}/20 shadow-lg hover:shadow-${color}/10 transition-all`}
  >
    <div className="flex items-center gap-4 mb-2">
      <div className={`p-3 rounded-xl bg-${color}/10 text-${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-lg font-medium text-gray-300">{title}</h3>
    </div>
    <p className={`text-3xl font-bold text-${color} mt-2`}>{value}</p>
  </motion.div>
)

// مكون العنصر الجانبي
const SidebarItem = ({ icon: Icon, text, active = false, onClick }: { icon: any, text: string, active?: boolean, onClick?: () => void }) => (
  <motion.div
    whileTap={{ scale: 0.97 }}
    onClick={onClick}
    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
      active ? 'bg-gold/10 text-gold' : 'text-gray-400 hover:bg-white/5 hover:text-white'
    }`}
  >
    <Icon className="w-5 h-5" />
    <span>{text}</span>
  </motion.div>
)

export default function AdminDirectPage() {
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // ضبط الأذونات عند التحميل
  useEffect(() => {
    // إنشاء بيانات المسؤول في localStorage
    const adminUser = {
      id: 'admin-direct',
      email: 'admin@education.com',
      role: 'admin',
      full_name: 'مسؤول النظام'
    }
    
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminOverride', 'true')
    localStorage.setItem('user', JSON.stringify(adminUser))
    
    console.log('تم تعيين أذونات المسؤول بنجاح')
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      
      {/* شريط التنبيه العلوي */}
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-green-500/10 border-b border-green-500/20 p-2 text-center text-green-400 text-sm"
      >
        تم تجاوز فحوصات الأمان - أنت تستخدم وضع الوصول المباشر للوحة الإدارة
      </motion.div>
      
      {/* واجهة الإدارة الرئيسية */}
      <div className="container mx-auto p-4 lg:p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* الشريط الجانبي */}
          <div className="col-span-12 lg:col-span-3">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-black rounded-2xl p-4 border border-gold/10 sticky top-6"
            >
              {/* شعار اللوحة */}
              <div className="flex items-center gap-3 mb-8 p-2">
                <div className="p-2 rounded-lg bg-gold/10">
                  <Shield className="w-6 h-6 text-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold gradient-text-gold">لوحة الإدارة</h2>
                  <p className="text-xs text-gray-500">وصول مباشر</p>
                </div>
              </div>
              
              {/* قائمة العناصر */}
              <div className="space-y-1">
                <SidebarItem 
                  icon={Settings} 
                  text="لوحة التحكم" 
                  active={activeTab === 'dashboard'} 
                  onClick={() => setActiveTab('dashboard')}
                />
                <SidebarItem 
                  icon={Users} 
                  text="المستخدمون" 
                  active={activeTab === 'users'} 
                  onClick={() => setActiveTab('users')}
                />
                <SidebarItem 
                  icon={Package} 
                  text="الباقات" 
                  active={activeTab === 'packages'} 
                  onClick={() => setActiveTab('packages')}
                />
                <SidebarItem 
                  icon={CreditCard} 
                  text="المدفوعات" 
                  active={activeTab === 'payments'} 
                  onClick={() => setActiveTab('payments')}
                />
              </div>
              
              <div className="border-t border-white/10 my-6"></div>
              
              <Link href="/" className="flex items-center gap-3 p-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all">
                <LogOut className="w-5 h-5" />
                <span>تسجيل الخروج</span>
              </Link>
            </motion.div>
          </div>
          
          {/* المحتوى الرئيسي */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* ترحيب */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black rounded-2xl p-6 border border-gold/10"
            >
              <h1 className="text-3xl font-bold mb-2 gradient-text-gold">مرحباً بك في لوحة الإدارة</h1>
              <p className="text-gray-400">هذه لوحة إدارة مباشرة تتجاوز فحوصات الأمان العادية</p>
            </motion.div>
            
            {/* بطاقات إحصائية */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard icon={Users} title="المستخدمون" value="120" color="blue" />
              <StatCard icon={Package} title="الباقات" value="5" color="purple" />
              <StatCard icon={CreditCard} title="المدفوعات" value="56" color="green" />
              <StatCard icon={AlertCircle} title="طلبات معلقة" value="12" color="amber" />
            </div>
            
            {/* محتوى التبويب */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-black rounded-2xl p-6 border border-white/10 min-h-[400px]"
            >
              {activeTab === 'dashboard' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">لوحة التحكم</h2>
                  <p className="text-gray-400">مرحباً بك في لوحة تحكم المسؤول المباشرة. هذه اللوحة متاحة بدون الحاجة إلى تسجيل الدخول.</p>
                  <p className="text-gray-400 mt-4">للعودة إلى اللوحة العادية التي تستخدم فحوصات الأمان، يرجى استخدام <span className="text-gold">/admin</span> بدلاً من <span className="text-gold">/admin-direct</span></p>
                  
                  <div className="mt-6">
                    <h3 className="text-lg font-medium text-white mb-3">روابط سريعة:</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Link href="/admin?override=true" className="p-4 bg-gold/10 rounded-xl hover:bg-gold/20 transition-all text-center">
                        <Shield className="w-8 h-8 text-gold mx-auto mb-2" />
                        <span className="block text-white">لوحة الإدارة مع التجاوز</span>
                      </Link>
                      <Link href="/login-admin" className="p-4 bg-purple-500/10 rounded-xl hover:bg-purple-500/20 transition-all text-center">
                        <LogOut className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <span className="block text-white">تسجيل دخول المسؤول</span>
                      </Link>
                      <Link href="/" className="p-4 bg-blue-500/10 rounded-xl hover:bg-blue-500/20 transition-all text-center">
                        <Settings className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                        <span className="block text-white">الصفحة الرئيسية</span>
                      </Link>
                    </div>
                  </div>
                </div>
              )}
              
              {activeTab === 'users' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">إدارة المستخدمين</h2>
                  <p className="text-gray-400">هنا يمكنك إدارة المستخدمين.</p>
                  <div className="mt-8 text-center text-gray-500">انتقل إلى لوحة الإدارة الكاملة للوصول إلى هذه الميزة</div>
                </div>
              )}
              
              {activeTab === 'packages' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">إدارة الباقات</h2>
                  <p className="text-gray-400">هنا يمكنك إدارة الباقات.</p>
                  <div className="mt-8 text-center text-gray-500">انتقل إلى لوحة الإدارة الكاملة للوصول إلى هذه الميزة</div>
                </div>
              )}
              
              {activeTab === 'payments' && (
                <div>
                  <h2 className="text-xl font-bold mb-4 text-white">إدارة المدفوعات</h2>
                  <p className="text-gray-400">هنا يمكنك إدارة المدفوعات.</p>
                  <div className="mt-8 text-center text-gray-500">انتقل إلى لوحة الإدارة الكاملة للوصول إلى هذه الميزة</div>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}
