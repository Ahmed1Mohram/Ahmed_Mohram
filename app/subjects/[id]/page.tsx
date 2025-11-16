'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams } from 'next/navigation'
import { 
  ArrowLeft, Video, FileText, Headphones, Clock, 
  Lock, Play, Download, CheckCircle, Users,
  Star, BookOpen, Award, TrendingUp, Eye, Camera, X, Plus, Trash2, Unlock, Pencil
} from 'lucide-react'
import { supabase, useAuth } from '@/components/providers'
import toast from 'react-hot-toast'

// نوع المحاضرة
interface Lecture {
  id: string
  title: string
  description: string
  thumbnail_url?: string
  lecture_content?: { id: string; type: 'video' | 'pdf' | 'audio' | 'text' }[]
  duration_minutes: number
  is_free: boolean
  order_index: number
  content_count?: number
  completed?: boolean
  progress?: number
}

// نوع المادة
interface Subject {
  id: string
  title: string
  description: string
  color: string
}

export default function SubjectLecturesPage() {
  const router = useRouter()
  const params = useParams()
  const subjectId = params.id as string
  const { isAdmin } = useAuth()
  
  const [subject, setSubject] = useState<Subject | null>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLecture, setSelectedLecture] = useState<string | null>(null)
  const [userSubscription, setUserSubscription] = useState<string>('inactive')
  const [showPicker, setShowPicker] = useState(false)
  const [pickerLecture, setPickerLecture] = useState<Lecture | null>(null)
  const [showAddLecture, setShowAddLecture] = useState(false)
  const [newLecture, setNewLecture] = useState({
    title: '',
    description: '',
    duration_minutes: 45,
    is_free: false,
    thumbnail_url: ''
  })
  const [showAddContent, setShowAddContent] = useState(false)
  const [contentLecture, setContentLecture] = useState<Lecture | null>(null)
  const [newContent, setNewContent] = useState({
    type: 'video' as 'video' | 'pdf' | 'audio' | 'text',
    title: '',
    description: '',
    content_url: '',
    duration: 0,
  })
  const [showEditLecture, setShowEditLecture] = useState(false)
  const [editLecture, setEditLecture] = useState<{ id: string; title: string; description: string; duration_minutes: number; is_free: boolean; thumbnail_url: string | null } | null>(null)

  useEffect(() => {
    if (subjectId) {
      fetchSubjectData()
      fetchLectures()
      checkUserSubscription()
    }
  }, [subjectId])

  const handleOpenAddContent = (lecture: Lecture) => {
    setContentLecture(lecture)
    setNewContent({ type: 'video', title: '', description: '', content_url: '', duration: 0 })
    setShowAddContent(true)
  }

  const handleSubmitAddContent = async () => {
    try {
      if (!contentLecture) return
      if (!newContent.title || !newContent.content_url) {
        toast.error('يرجى ملء العنوان والرابط')
        return
      }
      const { error } = await supabase
        .from('lecture_content')
        .insert({
          lecture_id: contentLecture.id,
          type: newContent.type,
          title: newContent.title,
          description: newContent.description,
          content_url: newContent.content_url,
          duration_minutes: newContent.duration,
        })
      if (error) throw error
      toast.success('تم إضافة المحتوى')
      setShowAddContent(false)
      fetchLectures()
    } catch (e) {
      console.error('Add content error:', e)
      toast.error('فشل إضافة المحتوى')
    }
  }

  const handleOpenEditLecture = (lecture: Lecture) => {
    setEditLecture({
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      duration_minutes: lecture.duration_minutes,
      is_free: lecture.is_free,
      thumbnail_url: lecture.thumbnail_url || null,
    })
    setShowEditLecture(true)
  }

  const handleSubmitEditLecture = async () => {
    try {
      if (!editLecture) return
      const { error } = await supabase
        .from('lectures')
        .update({
          title: editLecture.title,
          description: editLecture.description,
          duration_minutes: editLecture.duration_minutes,
          is_free: editLecture.is_free,
          thumbnail_url: editLecture.thumbnail_url || null,
        })
        .eq('id', editLecture.id)
      if (error) throw error
      setLectures(prev => prev.map(l => l.id === editLecture.id ? { ...l, 
        title: editLecture.title,
        description: editLecture.description,
        duration_minutes: editLecture.duration_minutes,
        is_free: editLecture.is_free,
        thumbnail_url: editLecture.thumbnail_url || undefined,
      } : l))
      toast.success('تم حفظ التعديلات')
      setShowEditLecture(false)
      setEditLecture(null)
    } catch (e) {
      console.error('Edit lecture error:', e)
      toast.error('فشل حفظ التعديلات')
    }
  }

  const handleToggleFree = async (lecture: Lecture) => {
    try {
      const { error } = await supabase
        .from('lectures')
        .update({ is_free: !lecture.is_free })
        .eq('id', lecture.id)
      if (error) throw error
      setLectures(prev => prev.map(l => l.id === lecture.id ? { ...l, is_free: !l.is_free } : l))
      toast.success(lecture.is_free ? 'تم جعلها مدفوعة' : 'تم جعلها مجانية')
    } catch (e) {
      console.error('Toggle free error:', e)
      toast.error('فشل التحديث')
    }
  }

  const handleDeleteLecture = async (lecture: Lecture) => {
    try {
      if (!window.confirm(`سيتم حذف "${lecture.title}" وجميع المحتوى المرتبط. متابعة؟`)) return
      await supabase.from('lecture_content').delete().eq('lecture_id', lecture.id)
      const { error } = await supabase.from('lectures').delete().eq('id', lecture.id)
      if (error) throw error
      setLectures(prev => prev.filter(l => l.id !== lecture.id))
      toast.success('تم حذف المحاضرة')
    } catch (e) {
      console.error('Delete lecture error:', e)
      toast.error('فشل حذف المحاضرة')
    }
  }

  const handleSetThumbnail = async (lecture: Lecture, e: any) => {
    try {
      if (e && e.stopPropagation) e.stopPropagation()
      const url = typeof window !== 'undefined' ? window.prompt('أدخل رابط صورة للمحاضرة (URL)') : ''
      if (!url) return
      const { error } = await supabase
        .from('lectures')
        .update({ thumbnail_url: url })
        .eq('id', lecture.id)
      if (error) throw error
      setLectures(prev => prev.map(l => l.id === lecture.id ? { ...l, thumbnail_url: url } : l))
      toast.success('تم تحديث صورة المحاضرة')
    } catch (err) {
      console.error('Error setting thumbnail:', err)
      toast.error('فشل تحديث الصورة')
    }
  }

  const fetchSubjectData = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', subjectId)
        .maybeSingle()

      if (error) throw error
      if (data) {
        setSubject(data)
      } else {
        setSubject({
          id: subjectId,
          title: 'علم التشريح - Anatomy',
          description: 'دراسة تركيب جسم الإنسان وأجهزته المختلفة',
          color: 'from-blue-500 to-purple-600'
        })
      }
    } catch (error) {
      console.error('Error fetching subject:', error)
      // بيانات تجريبية
      setSubject({
        id: subjectId,
        title: 'علم التشريح - Anatomy',
        description: 'دراسة تركيب جسم الإنسان وأجهزته المختلفة',
        color: 'from-blue-500 to-purple-600'
      })
    }
  }

  const fetchLectures = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select(`
          *,
          lecture_content(id, type)
        `)
        .eq('subject_id', subjectId)
        .eq('is_active', true)
        .order('order_index')

      if (error) throw error

      const lecturesWithData = data?.map(lecture => ({
        ...lecture,
        content_count: lecture.lecture_content?.length || 0,
        progress: Math.floor(Math.random() * 100), // مؤقت
        completed: Math.random() > 0.7 // مؤقت
      }))

      setLectures(lecturesWithData || [])
    } catch (error) {
      console.error('Error fetching lectures:', error)
      // بيانات تجريبية
      setLectures([
        {
          id: '1',
          title: 'مقدمة في علم التشريح',
          description: 'نظرة عامة على علم التشريح وأهميته في الطب',
          duration_minutes: 45,
          is_free: true,
          order_index: 1,
          content_count: 3,
          progress: 100,
          completed: true
        },
        {
          id: '2',
          title: 'الجهاز الهيكلي',
          description: 'دراسة تفصيلية للعظام والمفاصل',
          duration_minutes: 60,
          is_free: false,
          order_index: 2,
          content_count: 4,
          progress: 75,
          completed: false
        },
        {
          id: '3',
          title: 'الجهاز العضلي',
          description: 'أنواع العضلات ووظائفها',
          duration_minutes: 55,
          is_free: false,
          order_index: 3,
          content_count: 5,
          progress: 30,
          completed: false
        },
        {
          id: '4',
          title: 'الجهاز العصبي المركزي',
          description: 'المخ والنخاع الشوكي',
          duration_minutes: 90,
          is_free: false,
          order_index: 4,
          content_count: 6,
          progress: 0,
          completed: false
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const checkUserSubscription = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', user.id)
          .maybeSingle()
        if (data && data.subscription_status) {
          setUserSubscription(data.subscription_status)
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleLectureClick = (lecture: Lecture) => {
    if (!lecture.is_free && userSubscription !== 'active') {
      toast.error('هذه المحاضرة مدفوعة - يرجى الاشتراك أولاً')
      router.push('/subscription')
      return
    }
    setPickerLecture(lecture)
    setShowPicker(true)
  }

  const hasType = (lecture: Lecture | null, type: 'video' | 'audio' | 'pdf' | 'text') => {
    if (!lecture || !lecture.lecture_content) return false
    return lecture.lecture_content.some(c => (c.type || '').toLowerCase() === type)
  }

  const openLecture = (lecture: Lecture | null, type: 'video' | 'audio' | 'pdf' | 'text') => {
    if (!lecture) return
    if (!lecture.is_free && userSubscription !== 'active') {
      toast.error('هذه المحاضرة مدفوعة - يرجى الاشتراك أولاً')
      router.push('/subscription')
      return
    }
    setShowPicker(false)
    router.push(`/lecture/${lecture.id}?type=${type}`)
  }

  const handleCreateLecture = async () => {
    try {
      if (!newLecture.title) {
        toast.error('يرجى إدخال عنوان المحاضرة')
        return
      }
      const nextOrder = (lectures[lectures.length - 1]?.order_index || 0) + 1
      const { error } = await supabase
        .from('lectures')
        .insert({
          subject_id: subjectId,
          title: newLecture.title,
          description: newLecture.description,
          duration_minutes: newLecture.duration_minutes,
          is_free: newLecture.is_free,
          thumbnail_url: newLecture.thumbnail_url || null,
          order_index: nextOrder,
          is_active: true
        })
      if (error) throw error
      toast.success('تم إضافة المحاضرة')
      setShowAddLecture(false)
      setNewLecture({ title: '', description: '', duration_minutes: 45, is_free: false, thumbnail_url: '' })
      fetchLectures()
    } catch (e) {
      console.error('Add lecture error:', e)
      toast.error('فشل إضافة المحاضرة')
    }
  }

  const getTotalDuration = () => {
    const totalMinutes = lectures.reduce((sum, lecture) => sum + lecture.duration_minutes, 0)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return `${hours} ساعة ${minutes > 0 ? `و ${minutes} دقيقة` : ''}`
  }

  const getCompletedCount = () => {
    return lectures.filter(l => l.completed).length
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Background with gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 opacity-50" />
      
      {/* Animated particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-gold/30 rounded-full"
            animate={{
              y: [0, -100],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 5 + 5,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      <div className="relative z-10">
        {/* Header */}
        <div className={`relative bg-gradient-to-br ${subject?.color || 'from-blue-500 to-purple-600'} py-20`}>
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative container mx-auto px-4">
            <button
              onClick={() => router.push('/dashboard')}
              className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              العودة للوحة التحكم
            </button>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h1 className="text-4xl md:text-5xl font-black text-white mb-4">
                {subject?.title || 'جاري التحميل...'}
              </h1>
              <p className="text-xl text-white/80 mb-6">
                {subject?.description}
              </p>
              {isAdmin && (
                <div className="flex flex-wrap gap-3 mt-2">
                  <button
                    onClick={() => setShowAddLecture(true)}
                    className="px-4 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold hover:shadow-lg transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    إضافة محاضرة
                  </button>
                  <button
                    onClick={() => router.push('/admin')}
                    className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"
                  >
                    لوحة الأدمن
                  </button>
                </div>
              )}
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 text-white">
                <div className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  <span>{lectures.length} محاضرة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>{getTotalDuration()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <span>{getCompletedCount()} مكتملة</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <span>{Math.floor(Math.random() * 1000) + 500} طالب</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Lectures Grid */}
        <div className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <AnimatePresence>
                {lectures.map((lecture, index) => (
                  <motion.div
                    key={lecture.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -5 }}
                    onClick={() => handleLectureClick(lecture)}
                    className="cursor-pointer group"
                  >
                    <div className="relative overflow-hidden rounded-2xl md:rounded-3xl bg-gradient-to-br from-gold/10 via-black/70 to-black border-2 border-gold/30 shadow-2xl shadow-gold/10 backdrop-blur-xl transition-all duration-500 transform-gpu group-hover:shadow-gold/30 group-hover:border-gold/50 group-hover:-translate-y-1">
                      <div className="absolute -inset-[1px] rounded-[inherit] bg-gradient-to-r from-gold/30 to-yellow-500/20 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
                      {/* Lecture Number */}
                      <div className="absolute top-3 left-3 z-10 w-10 h-10 rounded-full bg-gold/30 border border-gold/50 backdrop-blur-sm flex items-center justify-center text-gold font-bold shadow-md shadow-gold/20">
                        {lecture.order_index}
                      </div>
                      
                      {/* Lock/Free Badge */}
                      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
                        {lecture.is_free ? (
                          <div className="bg-green-500/20 text-green-400 px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-md shadow-green-500/10">
                            مجاني
                          </div>
                        ) : (
                          <div className="bg-gold/20 text-gold px-3 py-1.5 rounded-full text-xs font-bold backdrop-blur-sm flex items-center gap-1 shadow-md shadow-gold/20">
                            <Lock className="w-3 h-3" />
                            مدفوع
                          </div>
                        )}
                        {isAdmin && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(ev) => handleSetThumbnail(lecture, ev)}
                              title="تعيين صورة"
                              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                            >
                              <Camera className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); handleOpenAddContent(lecture) }}
                              title="إضافة محتوى"
                              className="p-2 rounded-full bg-gold/20 hover:bg-gold/30 border border-gold/40 text-gold"
                            >
                              <Plus className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); handleToggleFree(lecture) }}
                              title={lecture.is_free ? 'جعلها مدفوعة' : 'جعلها مجانية'}
                              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                            >
                              {lecture.is_free ? <Lock className="w-4 h-4 text-red-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                            </button>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); handleOpenEditLecture(lecture) }}
                              title="تعديل"
                              className="p-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 text-white"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(ev) => { ev.stopPropagation(); handleDeleteLecture(lecture) }}
                              title="حذف"
                              className="p-2 rounded-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Thumbnail */}
                      <div className="relative h-56 md:h-64 bg-gradient-to-br from-gray-800 to-gray-900">
                        {lecture.thumbnail_url ? (
                          <img 
                            src={lecture.thumbnail_url}
                            alt={lecture.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Video className="w-16 h-16 text-gold/30" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                        
                        {/* Play Button Overlay */}
                        <motion.div
                          initial={{ opacity: 0 }}
                          whileHover={{ opacity: 1 }}
                          className="absolute inset-0 bg-black/40 flex items-center justify-center"
                        >
                          <Play className="w-12 h-12 text-gold drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]" />
                        </motion.div>
                        
                        {/* Progress Bar */}
                        {lecture.progress !== undefined && lecture.progress > 0 && (
                          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                            <div 
                              className="h-full bg-gradient-to-r from-gold to-yellow-500"
                              style={{ width: `${lecture.progress}%` }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-6 border-t border-white/10">
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-gold transition-colors">
                          {lecture.title}
                        </h3>
                        <p className="text-gray-300 text-sm md:text-base mb-4 line-clamp-2">
                          {lecture.description}
                        </p>
                        
                        {/* Meta Info */}
                        <div className="flex items-center justify-between text-xs md:text-sm text-gray-400">
                          <div className="flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {lecture.duration_minutes} دقيقة
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="w-4 h-4" />
                              {lecture.content_count} ملف
                            </span>
                          </div>
                          {lecture.completed && (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
      
      {/* Content Type Picker Modal */}
      {showPicker && pickerLecture && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-3xl luxury-card rounded-3xl p-8 relative">
            <button
              onClick={() => setShowPicker(false)}
              className="absolute top-4 left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold gradient-text mb-6">اختر نوع المحتوى</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* فيديو */}
              <button
                onClick={() => openLecture(pickerLecture, 'video')}
                disabled={!hasType(pickerLecture, 'video')}
                className={`rounded-2xl p-6 border-2 bg-gradient-to-br from-gold/10 via-black/60 to-black shadow-xl transition-all ${hasType(pickerLecture,'video') ? 'border-gold/40 hover:border-gold/60 hover:shadow-gold/30' : 'border-white/10 opacity-50 cursor-not-allowed'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-yellow-600/20 border border-gold/40 flex items-center justify-center text-gold mb-4">
                  <Video className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">فيديو</h4>
              </button>
              {/* ريكورد */}
              <button
                onClick={() => openLecture(pickerLecture, 'audio')}
                disabled={!hasType(pickerLecture, 'audio')}
                className={`rounded-2xl p-6 border-2 bg-gradient-to-br from-gold/10 via-black/60 to-black shadow-xl transition-all ${hasType(pickerLecture,'audio') ? 'border-gold/40 hover:border-gold/60 hover:shadow-gold/30' : 'border-white/10 opacity-50 cursor-not-allowed'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-yellow-600/20 border border-gold/40 flex items-center justify-center text-gold mb-4">
                  <Headphones className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">ريكورد</h4>
              </button>
              {/* PDF */}
              <button
                onClick={() => openLecture(pickerLecture, 'pdf')}
                disabled={!hasType(pickerLecture, 'pdf')}
                className={`rounded-2xl p-6 border-2 bg-gradient-to-br from-gold/10 via-black/60 to-black shadow-xl transition-all ${hasType(pickerLecture,'pdf') ? 'border-gold/40 hover:border-gold/60 hover:shadow-gold/30' : 'border-white/10 opacity-50 cursor-not-allowed'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-yellow-600/20 border border-gold/40 flex items-center justify-center text-gold mb-4">
                  <FileText className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">PDF</h4>
              </button>
              {/* شرح الدكتور */}
              <button
                onClick={() => openLecture(pickerLecture, 'text')}
                disabled={!hasType(pickerLecture, 'text')}
                className={`rounded-2xl p-6 border-2 bg-gradient-to-br from-gold/10 via-black/60 to-black shadow-xl transition-all ${hasType(pickerLecture,'text') ? 'border-gold/40 hover:border-gold/60 hover:shadow-gold/30' : 'border-white/10 opacity-50 cursor-not-allowed'}`}
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gold/30 to-yellow-600/20 border border-gold/40 flex items-center justify-center text-gold mb-4">
                  <BookOpen className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-white">شرح الدكتور</h4>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Lecture Modal (Admin) */}
      {isAdmin && showAddLecture && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-2xl luxury-card rounded-3xl p-8 relative">
            <button
              onClick={() => setShowAddLecture(false)}
              className="absolute top-4 left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold gradient-text mb-6">إضافة محاضرة جديدة</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm mb-2 block">العنوان</label>
                <input
                  type="text"
                  value={newLecture.title}
                  onChange={(e) => setNewLecture({ ...newLecture, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="عنوان المحاضرة"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">المدة (دقائق)</label>
                <input
                  type="number"
                  value={newLecture.duration_minutes}
                  onChange={(e) => setNewLecture({ ...newLecture, duration_minutes: parseInt(e.target.value || '0') })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-white/70 text-sm mb-2 block">الوصف</label>
                <textarea
                  rows={3}
                  value={newLecture.description}
                  onChange={(e) => setNewLecture({ ...newLecture, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="وصف مختصر"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">رابط الصورة (اختياري)</label>
                <input
                  type="text"
                  value={newLecture.thumbnail_url}
                  onChange={(e) => setNewLecture({ ...newLecture, thumbnail_url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <input
                  id="is_free"
                  type="checkbox"
                  checked={newLecture.is_free}
                  onChange={(e) => setNewLecture({ ...newLecture, is_free: e.target.checked })}
                  className="w-5 h-5"
                />
                <label htmlFor="is_free" className="text-white/80">مجاني</label>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleCreateLecture}
                className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold hover:shadow-lg transition-all"
              >
                إضافة
              </button>
              <button
                onClick={() => setShowAddLecture(false)}
                className="px-6 py-2 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Content Modal (Admin) */}
      {isAdmin && showAddContent && contentLecture && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-2xl luxury-card rounded-3xl p-8 relative">
            <button
              onClick={() => setShowAddContent(false)}
              className="absolute top-4 left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold gradient-text mb-6">إضافة محتوى للمحاضرة</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm mb-2 block">نوع المحتوى</label>
                <select
                  value={newContent.type}
                  onChange={(e) => setNewContent({ ...newContent, type: e.target.value as any })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
                >
                  <option value="video">فيديو</option>
                  <option value="pdf">PDF</option>
                  <option value="audio">ريكورد</option>
                  <option value="text">نص</option>
                </select>
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">المدة (دقائق) - اختياري</label>
                <input
                  type="number"
                  value={newContent.duration}
                  onChange={(e) => setNewContent({ ...newContent, duration: parseInt(e.target.value || '0') })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-white/70 text-sm mb-2 block">العنوان</label>
                <input
                  type="text"
                  value={newContent.title}
                  onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="عنوان المحتوى"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-white/70 text-sm mb-2 block">الرابط (URL)</label>
                <input
                  type="text"
                  value={newContent.content_url}
                  onChange={(e) => setNewContent({ ...newContent, content_url: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="https://..."
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-white/70 text-sm mb-2 block">الوصف (اختياري)</label>
                <textarea
                  rows={3}
                  value={newContent.description}
                  onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="وصف مختصر"
                />
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSubmitAddContent}
                className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold hover:shadow-lg transition-all"
              >
                إضافة
              </button>
              <button
                onClick={() => setShowAddContent(false)}
                className="px-6 py-2 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {isAdmin && showEditLecture && editLecture && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
          <div className="w-full max-w-2xl luxury-card rounded-3xl p-8 relative">
            <button
              onClick={() => setShowEditLecture(false)}
              className="absolute top-4 left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-2xl font-bold gradient-text mb-6">تعديل المحاضرة</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-sm mb-2 block">العنوان</label>
                <input
                  type="text"
                  value={editLecture.title}
                  onChange={(e) => setEditLecture(prev => prev ? { ...prev, title: e.target.value } : prev)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="عنوان المحاضرة"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">المدة (دقائق)</label>
                <input
                  type="number"
                  value={editLecture.duration_minutes}
                  onChange={(e) => setEditLecture(prev => prev ? { ...prev, duration_minutes: parseInt(e.target.value || '0') } : prev)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-white/70 text-sm mb-2 block">الوصف</label>
                <textarea
                  rows={3}
                  value={editLecture.description}
                  onChange={(e) => setEditLecture(prev => prev ? { ...prev, description: e.target.value } : prev)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="وصف مختصر"
                />
              </div>
              <div>
                <label className="text-white/70 text-sm mb-2 block">رابط الصورة</label>
                <input
                  type="text"
                  value={editLecture.thumbnail_url || ''}
                  onChange={(e) => setEditLecture(prev => prev ? { ...prev, thumbnail_url: e.target.value } : prev)}
                  className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                  placeholder="https://..."
                />
              </div>
              <div className="flex items-center gap-3 mt-6">
                <input
                  id="edit_is_free"
                  type="checkbox"
                  checked={editLecture.is_free}
                  onChange={(e) => setEditLecture(prev => prev ? { ...prev, is_free: e.target.checked } : prev)}
                  className="w-5 h-5"
                />
                <label htmlFor="edit_is_free" className="text-white/80">مجاني</label>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button
                onClick={handleSubmitEditLecture}
                className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold hover:shadow-lg transition-all"
              >
                حفظ
              </button>
              <button
                onClick={() => setShowEditLecture(false)}
                className="px-6 py-2 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-all"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
