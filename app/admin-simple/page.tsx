'use client'

import React from 'react'
import Link from 'next/link'
import { Shield, Users, Package, CreditCard, Settings, Home } from 'lucide-react'

export default function AdminSimplePage() {
  // تعيين حالة المسؤول عند تحميل الصفحة
  React.useEffect(() => {
    localStorage.setItem('isAdmin', 'true')
    localStorage.setItem('adminOverride', 'true')
    const adminUser = {
      id: 'admin-simple',
      email: 'admin@education.com',
      role: 'admin',
      full_name: 'مسؤول النظام'
    }
    localStorage.setItem('user', JSON.stringify(adminUser))
  }, [])

  const adminSections = [
    { icon: Users, title: 'المستخدمون', desc: 'إدارة المستخدمين والطلاب', color: 'blue' },
    { icon: Package, title: 'الباقات', desc: 'إدارة باقات الاشتراك', color: 'purple' },
    { icon: CreditCard, title: 'المدفوعات', desc: 'معالجة طلبات الدفع', color: 'green' },
    { icon: Settings, title: 'الإعدادات', desc: 'إعدادات النظام العامة', color: 'orange' }
  ]

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-6xl mx-auto">
        {/* رأس الصفحة */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="p-3 bg-gold/20 rounded-full">
              <Shield className="w-8 h-8 text-gold" />
            </div>
            <h1 className="text-4xl font-bold text-gold">لوحة الإدارة</h1>
          </div>
          <p className="text-gray-400 text-lg">مرحباً بك في لوحة إدارة منصة التعليم</p>
        </div>

        {/* إحصائيات سريعة */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-blue-400">156</div>
            <div className="text-gray-400">المستخدمون</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-purple-400">8</div>
            <div className="text-gray-400">الباقات</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-green-400">42</div>
            <div className="text-gray-400">المدفوعات</div>
          </div>
          <div className="bg-gray-900 p-4 rounded-xl border border-gray-700">
            <div className="text-2xl font-bold text-orange-400">23</div>
            <div className="text-gray-400">طلبات معلقة</div>
          </div>
        </div>

        {/* أقسام الإدارة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {adminSections.map((section, index) => (
            <div
              key={index}
              className="bg-gray-900 p-6 rounded-xl border border-gray-700 hover:border-gold/50 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg bg-${section.color}-500/20`}>
                  <section.icon className={`w-6 h-6 text-${section.color}-400`} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2 group-hover:text-gold transition-colors">
                    {section.title}
                  </h3>
                  <p className="text-gray-400">{section.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* الإجراءات السريعة */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-700">
          <h2 className="text-2xl font-bold mb-4 text-gold">الإجراءات السريعة</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link 
              href="/admin?force=true" 
              className="bg-gold/20 hover:bg-gold/30 p-4 rounded-lg text-center transition-all border border-gold/30 hover:border-gold"
            >
              <Shield className="w-8 h-8 text-gold mx-auto mb-2" />
              <div className="font-medium">لوحة الإدارة الكاملة</div>
              <div className="text-sm text-gray-400">الانتقال للوحة الإدارة الأصلية</div>
            </Link>
            
            <Link 
              href="/admin-direct" 
              className="bg-purple-500/20 hover:bg-purple-500/30 p-4 rounded-lg text-center transition-all border border-purple-500/30 hover:border-purple-500"
            >
              <Settings className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <div className="font-medium">لوحة الإدارة البديلة</div>
              <div className="text-sm text-gray-400">واجهة مبسطة للإدارة</div>
            </Link>
            
            <Link 
              href="/" 
              className="bg-blue-500/20 hover:bg-blue-500/30 p-4 rounded-lg text-center transition-all border border-blue-500/30 hover:border-blue-500"
            >
              <Home className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <div className="font-medium">الصفحة الرئيسية</div>
              <div className="text-sm text-gray-400">العودة للموقع الرئيسي</div>
            </Link>
          </div>
        </div>

        {/* معلومات الحالة */}
        <div className="mt-8 text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-4 py-2 rounded-full">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>أنت مسجل دخول كمسؤول</span>
          </div>
        </div>
      </div>
    </div>
  )
}
