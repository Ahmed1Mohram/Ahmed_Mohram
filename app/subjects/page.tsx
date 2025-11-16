'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, Video, FileText, Headphones, Clock, Users, 
  Lock, Unlock, Star, TrendingUp, Award, Eye,
  Sparkles, Crown, Diamond, ChevronRight, Play,
  Globe, MapPin, Briefcase, BarChart3, Calendar, Plus, Trash2
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '@/components/providers'
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
  total_duration?: number
  students_count?: number
}

interface LectureContent {
  id: string
  type: 'video' | 'pdf' | 'audio'
  title: string
  description?: string
  content_url: string
  duration?: number
  order_index: number
}

// صور افتراضية للمواد
const defaultImages = [
  'https://images.unsplash.com/photo-1532619675605-1ede6c2ed2b0?w=800',
  'https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800',
  'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800',
  'https://images.unsplash.com/photo-1584362917165-526a968579e8?w=800',
  'https://images.unsplash.com/photo-1581093458791-9d42e3c7e117?w=800',
  'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=800'
]

export default function SubjectsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [redirecting, setRedirecting] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null)
  const [subjectContent, setSubjectContent] = useState<LectureContent[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newContent, setNewContent] = useState({
    type: 'video' as 'video' | 'pdf' | 'audio',
    title: '',
    description: '',
    content_url: '',
    duration: 0
  })

  useEffect(() => {
    router.replace('/subjects/9c13de33-1c41-430d-8852-f4a3af7c9c6e')
  }, [router])

  useEffect(() => {
    fetchSubjects()
    checkAdminStatus()
  }, [])

  const checkAdminStatus = async () => {
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()
      
      setIsAdmin(data?.role === 'admin')
    }
  }

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .order('order_index')

      if (error) throw error

      // إضافة صور افتراضية إذا لم توجد صور
      const subjectsWithImages = (data || []).map((subject, index) => ({
        ...subject,
        image_url: subject.image_url || defaultImages[index % defaultImages.length],
        lectures_count: Math.floor(Math.random() * 20) + 5,
        total_duration: Math.floor(Math.random() * 300) + 60,
        students_count: Math.floor(Math.random() * 500) + 100
      }))

      setSubjects(subjectsWithImages)
    } catch (error) {
      console.error('Error fetching subjects:', error)
      // بيانات تجريبية
      setSubjects([
        {
          id: '1',
          title: 'علم التشريح - Anatomy',
          description: 'دراسة تركيب جسم الإنسان وأجهزته المختلفة',
          image_url: defaultImages[0],
          icon: '🧬',
          color: 'from-blue-500 to-purple-600',
          is_premium: false,
          order_index: 1,
          lectures_count: 24,
          total_duration: 180,
          students_count: 350
        },
        {
          id: '2',
          title: 'علم وظائف الأعضاء - Physiology',
          description: 'دراسة وظائف أعضاء وأجهزة الجسم',
          image_url: defaultImages[1],
          icon: '🫀',
          color: 'from-red-500 to-pink-600',
          is_premium: true,
          order_index: 2,
          lectures_count: 18,
          total_duration: 240,
          students_count: 280
        },
        {
          id: '3',
          title: 'الكيمياء الحيوية - Biochemistry',
          description: 'دراسة التفاعلات الكيميائية في الكائنات الحية',
          image_url: defaultImages[2],
          icon: '🧪',
          color: 'from-green-500 to-teal-600',
          is_premium: true,
          order_index: 3,
          lectures_count: 22,
          total_duration: 200,
          students_count: 420
        },
        {
          id: '4',
          title: 'علم الأمراض - Pathology',
          description: 'دراسة الأمراض وأسبابها وتأثيراتها',
          image_url: defaultImages[3],
          icon: '🔬',
          color: 'from-yellow-500 to-orange-600',
          is_premium: false,
          order_index: 4,
          lectures_count: 30,
          total_duration: 360,
          students_count: 510
        }
      ])
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjectContent = async (subjectId: string) => {
    try {
      // جلب المحاضرات أولاً
      const { data: lectures } = await supabase
        .from('lectures')
        .select('id')
        .eq('subject_id', subjectId)

      if (lectures && lectures.length > 0) {
        // جلب محتوى المحاضرات
        const { data: content } = await supabase
          .from('lecture_content')
          .select('*')
          .in('lecture_id', lectures.map(l => l.id))
          .order('order_index')

        setSubjectContent(content || [])
      } else {
        // محتوى تجريبي
        setSubjectContent([
          {
            id: '1',
            type: 'video',
            title: 'مقدمة في المادة',
            description: 'فيديو تعريفي شامل',
            content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
            duration: 45,
            order_index: 1
          },
          {
            id: '2',
            type: 'pdf',
            title: 'ملخص الفصل الأول',
            description: 'ملف PDF شامل',
            content_url: '/sample.pdf',
            order_index: 2
          },
          {
            id: '3',
            type: 'audio',
            title: 'شرح صوتي للمفاهيم',
            description: 'تسجيل صوتي مفصل',
            content_url: '/sample.mp3',
            duration: 30,
            order_index: 3
          }
        ])
      }
    } catch (error) {
      console.error('Error fetching content:', error)
    }
  }

  const handleSubjectClick = (subject: Subject) => {
    setSelectedSubject(subject)
    fetchSubjectContent(subject.id)
  }

  const handleAddContent = async () => {
    if (!selectedSubject || !newContent.title || !newContent.content_url) {
      toast.error('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    try {
      // إضافة المحتوى لقاعدة البيانات
      const { error } = await supabase
        .from('lecture_content')
        .insert({
          lecture_id: selectedSubject.id, // مؤقتاً نستخدم subject id
          type: newContent.type,
          title: newContent.title,
          description: newContent.description,
          content_url: newContent.content_url,
          duration_minutes: newContent.duration,
          order_index: subjectContent.length + 1
        })

      if (error) throw error

      toast.success('تم إضافة المحتوى بنجاح')
      fetchSubjectContent(selectedSubject.id)
      setShowAddForm(false)
      setNewContent({
        type: 'video',
        title: '',
        description: '',
        content_url: '',
        duration: 0
      })
    } catch (error) {
      toast.error('حدث خطأ في إضافة المحتوى')
    }
  }

  const handleDeleteContent = async (contentId: string) => {
    try {
      const { error } = await supabase
        .from('lecture_content')
        .delete()
        .eq('id', contentId)

      if (error) throw error

      toast.success('تم حذف المحتوى')
      if (selectedSubject) {
        fetchSubjectContent(selectedSubject.id)
      }
    } catch (error) {
      toast.error('حدث خطأ في حذف المحتوى')
    }
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Play className="w-5 h-5" />
      case 'pdf':
        return <FileText className="w-5 h-5" />
      case 'audio':
        return <Headphones className="w-5 h-5" />
      default:
        return <BookOpen className="w-5 h-5" />
    }
  }

  const getContentColor = (type: string) => {
    switch (type) {
      case 'video':
        return 'from-red-500 to-pink-600'
      case 'pdf':
        return 'from-blue-500 to-cyan-600'
      case 'audio':
        return 'from-green-500 to-emerald-600'
      default:
        return 'from-gray-500 to-gray-600'
    }
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="relative overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-gold rounded-full filter blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-600 rounded-full filter blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-6xl font-black gradient-text-animated mb-4">
              المواد الدراسية
            </h1>
            <p className="text-xl text-white/80">
              اختر المادة التي تريد دراستها وابدأ رحلة التعلم
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <AnimatePresence mode="wait">
          {!selectedSubject ? (
            // عرض المواد
            <motion.div
              key="subjects"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 xl:gap-10"
            >
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleSubjectClick(subject)}
                  className="group cursor-pointer"
                >
                  <div className="relative h-[28rem] md:h-[30rem] rounded-3xl overflow-hidden luxury-card border-2 border-gold/30 bg-gradient-to-br from-gold/10 via-black/60 to-black shadow-2xl shadow-gold/10 backdrop-blur-xl transition-all duration-500 group-hover:shadow-gold/30 group-hover:border-gold/50 group-hover:-translate-y-1">
                    {/* الصورة الخلفية */}
                    <div className="absolute inset-0">
                      <img
                        src={subject.image_url}
                        alt={subject.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
                      <div className="absolute -inset-[1px] rounded-[inherit] bg-gradient-to-r from-gold/30 to-yellow-500/20 opacity-0 group-hover:opacity-20 transition-opacity duration-500 pointer-events-none"></div>
                    </div>

                    {/* المحتوى */}
                    <div className="relative h-full flex flex-col justify-end p-6">
                      {/* شارة Premium */}
                      {subject.is_premium && (
                        <div className="absolute top-6 right-6">
                          <div className="bg-gradient-to-r from-gold to-yellow-500 text-black px-3 py-1.5 rounded-full text-sm font-bold flex items-center gap-1 shadow-md shadow-gold/30">
                            <Crown className="w-4 h-4" />
                            Premium
                          </div>
                        </div>
                      )}

                      {/* أيقونة المادة */}
                      <div className="text-5xl mb-4 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">{subject.icon}</div>

                      {/* العنوان والوصف */}
                      <h3 className="text-3xl font-bold text-white mb-2 group-hover:text-gold transition-colors">
                        {subject.title}
                      </h3>
                      <p className="text-white/70 text-base mb-4 line-clamp-2">
                        {subject.description}
                      </p>

                      {/* الإحصائيات */}
                      <div className="grid grid-cols-3 gap-2 pt-4 border-t border-white/20">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-white/60 text-xs">
                            <Video className="w-4 h-4" />
                            <span>{subject.lectures_count}</span>
                          </div>
                          <p className="text-white/40 text-xs mt-1">محاضرة</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-white/60 text-xs">
                            <Clock className="w-4 h-4" />
                            <span>{subject.total_duration}</span>
                          </div>
                          <p className="text-white/40 text-xs mt-1">دقيقة</p>
                        </div>
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-1 text-white/60 text-xs">
                            <Users className="w-4 h-4" />
                            <span>{subject.students_count}</span>
                          </div>
                          <p className="text-white/40 text-xs mt-1">طالب</p>
                        </div>
                      </div>

                      {/* زر الدخول */}
                      <div className="mt-4 flex items-center justify-center">
                        <div className="bg-white/10 backdrop-blur-sm px-5 py-2.5 rounded-full flex items-center gap-2 border border-gold/30 shadow-lg shadow-gold/20 group-hover:bg-gold group-hover:text-black transition-all">
                          <span className="text-sm font-bold">ابدأ الآن</span>
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            // عرض محتوى المادة
            <motion.div
              key="content"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="max-w-6xl mx-auto"
            >
              {/* Header */}
              <div className="luxury-card rounded-3xl p-8 mb-8">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <button
                      onClick={() => setSelectedSubject(null)}
                      className="text-gold hover:text-yellow-500 mb-4 flex items-center gap-2 transition-colors"
                    >
                      <ChevronRight className="w-5 h-5 rotate-180" />
                      العودة للمواد
                    </button>
                    <div className="flex items-center gap-4 mb-4">
                      <span className="text-5xl">{selectedSubject.icon}</span>
                      <div>
                        <h2 className="text-3xl font-bold gradient-text">
                          {selectedSubject.title}
                        </h2>
                        <p className="text-white/70 mt-2">
                          {selectedSubject.description}
                        </p>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <button
                      onClick={() => setShowAddForm(!showAddForm)}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      إضافة محتوى
                    </button>
                  )}
                </div>
              </div>

              {/* نموذج إضافة المحتوى */}
              {showAddForm && isAdmin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="luxury-card rounded-2xl p-6 mb-8"
                >
                  <h3 className="text-xl font-bold text-gold mb-4">إضافة محتوى جديد</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">النوع</label>
                      <select
                        value={newContent.type}
                        onChange={(e) => setNewContent({ ...newContent, type: e.target.value as any })}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
                      >
                        <option value="video">فيديو</option>
                        <option value="pdf">PDF</option>
                        <option value="audio">صوت</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">العنوان</label>
                      <input
                        type="text"
                        value={newContent.title}
                        onChange={(e) => setNewContent({ ...newContent, title: e.target.value })}
                        placeholder="عنوان المحتوى"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">الرابط</label>
                      <input
                        type="text"
                        value={newContent.content_url}
                        onChange={(e) => setNewContent({ ...newContent, content_url: e.target.value })}
                        placeholder="رابط المحتوى"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">المدة (دقائق)</label>
                      <input
                        type="number"
                        value={newContent.duration}
                        onChange={(e) => setNewContent({ ...newContent, duration: parseInt(e.target.value) })}
                        placeholder="المدة بالدقائق"
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="text-white/70 text-sm mb-2 block">الوصف</label>
                      <textarea
                        value={newContent.description}
                        onChange={(e) => setNewContent({ ...newContent, description: e.target.value })}
                        placeholder="وصف المحتوى (اختياري)"
                        rows={3}
                        className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="flex gap-4 mt-6">
                    <button
                      onClick={handleAddContent}
                      className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold hover:shadow-lg transition-all"
                    >
                      إضافة
                    </button>
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-2 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-all"
                    >
                      إلغاء
                    </button>
                  </div>
                </motion.div>
              )}

              {/* المحتوى */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {subjectContent.map((content, index) => (
                  <motion.div
                    key={content.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="group"
                  >
                    <div className="luxury-card rounded-2xl p-6 hover:scale-105 transition-all cursor-pointer">
                      {/* أيقونة النوع */}
                      <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${getContentColor(content.type)} flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                        {getContentIcon(content.type)}
                      </div>

                      {/* العنوان والوصف */}
                      <h4 className="text-lg font-bold text-white mb-2 group-hover:text-gold transition-colors">
                        {content.title}
                      </h4>
                      {content.description && (
                        <p className="text-white/60 text-sm mb-4 line-clamp-2">
                          {content.description}
                        </p>
                      )}

                      {/* المعلومات */}
                      <div className="flex items-center justify-between pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-white/50 text-sm">
                          <Clock className="w-4 h-4" />
                          <span>{content.duration || 30} دقيقة</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (typeof window !== 'undefined') {
                                window.open(content.content_url, '_blank')
                              }
                            }}
                            className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-all"
                          >
                            <Eye className="w-4 h-4 text-white" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => handleDeleteContent(content.id)}
                              className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition-all"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}

                {/* كارت إضافة محتوى */}
                {isAdmin && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: subjectContent.length * 0.1 }}
                    onClick={() => setShowAddForm(true)}
                    className="group cursor-pointer"
                  >
                    <div className="luxury-card rounded-2xl p-6 h-full min-h-[200px] flex items-center justify-center hover:scale-105 transition-all border-2 border-dashed border-white/20 hover:border-gold/50">
                      <div className="text-center">
                        <Plus className="w-12 h-12 text-white/30 group-hover:text-gold mx-auto mb-3 transition-colors" />
                        <p className="text-white/50 group-hover:text-white transition-colors">
                          إضافة محتوى جديد
                        </p>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
