'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import { 
  User, Mail, Phone, Calendar, Shield, CreditCard,
  CheckCircle, XCircle, Clock, Ban, ChevronLeft,
  Edit, Save, X, AlertTriangle, Activity, BookOpen
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/components/providers'

 

interface UserData {
  id: string
  full_name: string
  email: string
  phone_number: string
  status: string
  subscription_status: string
  subscription_end_date?: string
  role: string
  created_at: string
  updated_at: string
  bio?: string
  avatar_url?: string
}

export default function UserDetailPage() {
  const router = useRouter()
  const params = useParams()
  const userId = params.id as string
  
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editedUser, setEditedUser] = useState<UserData | null>(null)

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) throw error
      setUser(data)
      setEditedUser(data)
    } catch (error) {
      console.error('Error fetching user:', error)
      toast.error('فشل جلب بيانات المستخدم')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!editedUser) return

    try {
      const { error } = await supabase
        .from('users')
        .update({
          full_name: editedUser.full_name,
          email: editedUser.email,
          phone_number: editedUser.phone_number,
          status: editedUser.status,
          subscription_status: editedUser.subscription_status,
          role: editedUser.role
        })
        .eq('id', userId)

      if (error) throw error

      toast.success('تم حفظ التغييرات')
      setUser(editedUser)
      setEditing(false)
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('فشل حفظ التغييرات')
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      const updates: any = { status }

      // لا نقوم بتفعيل الاشتراك تلقائياً عند جعل الحالة "approved"
      // فقط نجبر الاشتراك على أن يكون غير نشط للحالات الأخرى مثل الرفض أو الحظر
      if (status !== 'approved') {
        updates.subscription_status = 'inactive'
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) throw error

      toast.success(`تم تحديث حالة المستخدم إلى ${status}`)
      fetchUser()
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('فشل تحديث الحالة')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-white">المستخدم غير موجود</p>
          <button
            onClick={() => router.push('/admin')}
            className="mt-4 px-6 py-2 bg-gold text-black rounded-lg font-bold hover:bg-yellow-600 transition-all"
          >
            العودة للوحة الأدمن
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => router.push('/admin')}
            className="flex items-center gap-2 text-gold hover:text-yellow-500 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            العودة للوحة الأدمن
          </button>
          
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className={`px-4 py-2 rounded-lg font-bold transition-all flex items-center gap-2 ${
              editing 
                ? 'bg-green-500 hover:bg-green-600 text-white'
                : 'bg-gold hover:bg-yellow-600 text-black'
            }`}
          >
            {editing ? (
              <>
                <Save className="w-4 h-4" />
                حفظ التغييرات
              </>
            ) : (
              <>
                <Edit className="w-4 h-4" />
                تعديل البيانات
              </>
            )}
          </button>
        </div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="luxury-card rounded-3xl p-8 mb-8"
        >
          {/* Avatar & Name */}
          <div className="flex items-start gap-6 mb-8">
            <div className="w-24 h-24 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center text-4xl font-bold text-black">
              {user.full_name.charAt(0)}
            </div>
            
            <div className="flex-1">
              {editing ? (
                <input
                  type="text"
                  value={editedUser?.full_name}
                  onChange={(e) => setEditedUser({ ...editedUser!, full_name: e.target.value })}
                  className="text-3xl font-bold bg-white/10 border border-gold/30 rounded-lg px-3 py-1 text-white mb-2 w-full"
                />
              ) : (
                <h1 className="text-3xl font-bold gradient-text mb-2">{user.full_name}</h1>
              )}
              
              <div className="flex items-center gap-4">
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  user.status === 'approved' ? 'bg-green-500/20 text-green-400' :
                  user.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                  user.status === 'rejected' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {user.status === 'approved' ? 'مقبول' :
                   user.status === 'pending' ? 'معلق' :
                   user.status === 'rejected' ? 'مرفوض' : 'محظور'}
                </span>
                
                <span className={`px-3 py-1 rounded-full text-sm font-bold ${
                  user.role === 'admin' ? 'bg-gold/20 text-gold' :
                  user.role === 'teacher' ? 'bg-purple-500/20 text-purple-400' :
                  'bg-blue-500/20 text-blue-400'
                }`}>
                  {user.role === 'admin' ? 'أدمن' :
                   user.role === 'teacher' ? 'مدرس' : 'طالب'}
                </span>
              </div>
            </div>
          </div>

          {/* User Details Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Email */}
            <div className="bg-black/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <Mail className="w-4 h-4" />
                <span className="text-sm">البريد الإلكتروني</span>
              </div>
              {editing ? (
                <input
                  type="email"
                  value={editedUser?.email}
                  onChange={(e) => setEditedUser({ ...editedUser!, email: e.target.value })}
                  className="w-full bg-white/10 border border-gold/30 rounded-lg px-3 py-2 text-white"
                />
              ) : (
                <p className="text-white font-mono">{user.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="bg-black/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <Phone className="w-4 h-4" />
                <span className="text-sm">رقم الهاتف</span>
              </div>
              {editing ? (
                <input
                  type="tel"
                  value={editedUser?.phone_number}
                  onChange={(e) => setEditedUser({ ...editedUser!, phone_number: e.target.value })}
                  className="w-full bg-white/10 border border-gold/30 rounded-lg px-3 py-2 text-white"
                />
              ) : (
                <p className="text-white font-mono">{user.phone_number}</p>
              )}
            </div>

            {/* Subscription Status */}
            <div className="bg-black/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <CreditCard className="w-4 h-4" />
                <span className="text-sm">حالة الاشتراك</span>
              </div>
              {editing ? (
                <select
                  value={editedUser?.subscription_status}
                  onChange={(e) => setEditedUser({ ...editedUser!, subscription_status: e.target.value })}
                  className="w-full bg-white/10 border border-gold/30 rounded-lg px-3 py-2 text-white"
                >
                  <option value="active">نشط</option>
                  <option value="inactive">غير نشط</option>
                  <option value="expired">منتهي</option>
                </select>
              ) : (
                <p className={`font-bold ${
                  user.subscription_status === 'active' ? 'text-green-400' :
                  user.subscription_status === 'expired' ? 'text-orange-400' :
                  'text-gray-400'
                }`}>
                  {user.subscription_status === 'active' ? 'نشط' :
                   user.subscription_status === 'expired' ? 'منتهي' : 'غير نشط'}
                </p>
              )}
            </div>

            {/* Join Date */}
            <div className="bg-black/30 rounded-xl p-4">
              <div className="flex items-center gap-2 text-white/60 mb-2">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">تاريخ الانضمام</span>
              </div>
              <p className="text-white">
                {new Date(user.created_at).toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 mt-8 pt-8 border-t border-white/10">
            {user.status === 'pending' && (
              <>
                <button
                  onClick={() => handleStatusChange('approved')}
                  className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-green-500/30 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  قبول الطالب
                </button>
                <button
                  onClick={() => handleStatusChange('rejected')}
                  className="px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center gap-2"
                >
                  <XCircle className="w-5 h-5" />
                  رفض الطلب
                </button>
              </>
            )}
            
            {user.status !== 'banned' && user.role !== 'admin' && (
              <button
                onClick={() => handleStatusChange('banned')}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-red-500/30 transition-all flex items-center gap-2"
              >
                <Ban className="w-5 h-5" />
                حظر المستخدم
              </button>
            )}
            
            {user.status === 'banned' && (
              <button
                onClick={() => handleStatusChange('approved')}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all flex items-center gap-2"
              >
                <Shield className="w-5 h-5" />
                إلغاء الحظر
              </button>
            )}
            
            {editing && (
              <button
                onClick={() => {
                  setEditedUser(user)
                  setEditing(false)
                }}
                className="px-6 py-3 bg-gray-500/20 text-gray-400 rounded-xl font-bold hover:bg-gray-500/30 transition-all flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                إلغاء
              </button>
            )}
          </div>
        </motion.div>

        {/* Activity Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="luxury-card rounded-3xl p-8"
        >
          <h2 className="text-2xl font-bold gradient-text mb-6 flex items-center gap-3">
            <Activity className="w-6 h-6" />
            النشاط والإحصائيات
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <BookOpen className="w-8 h-8 text-gold mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-white/60 text-sm">المواد المشترك بها</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-white/60 text-sm">ساعات المشاهدة</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">0%</p>
              <p className="text-white/60 text-sm">نسبة الإنجاز</p>
            </div>
            
            <div className="bg-black/30 rounded-xl p-4 text-center">
              <CreditCard className="w-8 h-8 text-purple-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-white">0</p>
              <p className="text-white/60 text-sm">المدفوعات</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
