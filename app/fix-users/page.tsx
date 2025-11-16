'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

export default function FixUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [phoneNumber, setPhoneNumber] = useState('')

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/reset-user')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.users)
        toast.success(`تم جلب ${data.count} مستخدم`)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('فشل جلب المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: 'delete' | 'reset_password', phone?: string) => {
    const targetPhone = phone || phoneNumber
    
    if (!targetPhone) {
      toast.error('أدخل رقم الهاتف')
      return
    }

    try {
      const response = await fetch('/api/reset-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: targetPhone,
          action
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success(data.message)
        fetchUsers() // إعادة جلب المستخدمين
        setPhoneNumber('')
      } else {
        toast.error(data.error)
      }
    } catch (error) {
      console.error('Error:', error)
      toast.error('حدث خطأ')
    }
  }

  return (
    <div className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-card rounded-3xl p-8 mb-8"
        >
          <h1 className="text-3xl font-bold gradient-text mb-6">
            إدارة المستخدمين وحل المشاكل
          </h1>
          
          {/* أدوات سريعة */}
          <div className="bg-black/50 rounded-xl p-6 mb-8 border border-gold/20">
            <h2 className="text-xl font-bold text-gold mb-4">أدوات سريعة</h2>
            
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="رقم الهاتف (مثال: 01012345678)"
                className="flex-1 px-4 py-3 bg-black/50 border border-gold/20 rounded-lg text-white"
              />
            </div>
            
            <div className="flex gap-4">
              <button
                onClick={() => handleAction('delete')}
                className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                حذف المستخدم
              </button>
              
              <button
                onClick={() => handleAction('reset_password')}
                className="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
              >
                إعادة تعيين كلمة المرور
              </button>
              
              <button
                onClick={fetchUsers}
                className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                تحديث القائمة
              </button>
            </div>
            
            <p className="text-gray-400 text-sm mt-4">
              * إعادة تعيين كلمة المرور ستسمح بتسجيل الدخول بأي كلمة مرور جديدة
            </p>
          </div>

          {/* قائمة المستخدمين */}
          <div className="bg-black/50 rounded-xl p-6 border border-gold/20">
            <h2 className="text-xl font-bold text-gold mb-4">
              المستخدمون المسجلون ({users.length})
            </h2>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="border-b border-gold/20">
                    <tr className="text-gold">
                      <th className="p-3">الاسم</th>
                      <th className="p-3">البريد</th>
                      <th className="p-3">الهاتف</th>
                      <th className="p-3">الدور</th>
                      <th className="p-3">الحالة</th>
                      <th className="p-3">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-900/50">
                        <td className="p-3 text-white">{user.full_name}</td>
                        <td className="p-3 text-gray-400">{user.email}</td>
                        <td className="p-3 text-gray-400">{user.phone_number}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.role === 'admin' ? 'bg-gold text-black' : 
                            user.role === 'teacher' ? 'bg-blue-500 text-white' : 
                            'bg-gray-600 text-white'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            user.status === 'approved' ? 'bg-green-500 text-white' : 
                            user.status === 'pending' ? 'bg-yellow-500 text-black' : 
                            'bg-red-500 text-white'
                          }`}>
                            {user.status}
                          </span>
                        </td>
                        <td className="p-3">
                          {user.role !== 'admin' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAction('reset_password', user.phone_number)}
                                className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-xs rounded transition-colors"
                              >
                                إعادة تعيين
                              </button>
                              <button
                                onClick={() => handleAction('delete', user.phone_number)}
                                className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded transition-colors"
                              >
                                حذف
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* إرشادات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="luxury-card rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold gradient-text mb-4">
            حل المشاكل الشائعة
          </h2>
          
          <div className="space-y-4 text-white/80">
            <div>
              <h3 className="text-lg font-semibold text-gold mb-2">
                1. "رقم الهاتف مسجل مسبقاً"
              </h3>
              <p className="mb-2">الحل: احذف المستخدم القديم أو أعد تعيين كلمة المرور</p>
              <code className="bg-black/50 px-3 py-1 rounded text-sm text-green-400">
                أدخل رقم الهاتف واضغط "حذف المستخدم"
              </code>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gold mb-2">
                2. "Invalid login credentials"
              </h3>
              <p className="mb-2">الحل: أعد تعيين كلمة المرور</p>
              <code className="bg-black/50 px-3 py-1 rounded text-sm text-green-400">
                أدخل رقم الهاتف واضغط "إعادة تعيين كلمة المرور"
              </code>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gold mb-2">
                3. دخول الأدمن المباشر
              </h3>
              <p className="mb-2">استخدم:</p>
              <code className="bg-black/50 px-3 py-1 rounded text-sm text-green-400 block">
                رقم الهاتف: أحمد محرم
              </code>
              <code className="bg-black/50 px-3 py-1 rounded text-sm text-green-400 block mt-1">
                كلمة المرور: أحمد محرم
              </code>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
