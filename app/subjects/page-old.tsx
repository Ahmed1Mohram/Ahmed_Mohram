'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { 
  BookOpen, Video, FileText, Headphones, Clock, Users, 
  Lock, Unlock, Star, TrendingUp, Award, Eye,
  Sparkles, Crown, Diamond, ChevronRight, Play,
  Globe, MapPin, Briefcase, ChartBar, Calendar
} from 'lucide-react'
import { supabase } from '@/components/providers'
import toast from 'react-hot-toast'

// نوع المادة
interface Subject {
  id: string
  title: string
  description: string
  image_url: string
  icon: string
  color: string
  is_premium: boolean
  lecture_count?: number
  total_views?: number
  duration?: string
}

export default function SubjectsPage() {
  const router = useRouter()
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [userSubscription, setUserSubscription] = useState<string>('inactive')
  const [hoveredCard, setHoveredCard] = useState<string | null>(null)

  useEffect(() => {
    fetchSubjects()
    checkUserSubscription()
  }, [])

  const fetchSubjects = async () => {
    try {
      const { data, error } = await supabase
        .from('subjects')
        .select(`
          *,
          lectures!inner(id)
        `)
        .eq('is_active', true)
        .order('order_index')

      if (error) throw error

      // حساب عدد المحاضرات لكل مادة
      const subjectsWithCount = data?.map(subject => ({
        ...subject,
        lecture_count: subject.lectures?.length || 0,
        total_views: Math.floor(Math.random() * 5000) + 1000, // مؤقت
        duration: `${Math.floor(Math.random() * 20) + 10} ساعة` // مؤقت
      }))

      setSubjects(subjectsWithCount || [])
    } catch (error) {
      console.error('Error fetching subjects:', error)
      // بيانات تجريبية
      setSubjects([
        {
          id: '1',
          title: 'علم التشريح - Anatomy',
          description: 'دراسة تركيب جسم الإنسان وأجهزته المختلفة',
          image_url: 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56',
          icon: '🧬',
          color: 'from-blue-500 to-purple-600',
          is_premium: false,
          lecture_count: 24,
          total_views: 3420,
          duration: '18 ساعة'
        },
        {
          id: '2',
          title: 'علم وظائف الأعضاء - Physiology',
          description: 'دراسة وظائف أعضاء وأجهزة الجسم',
          image_url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557',
          icon: '🫀',
          color: 'from-red-500 to-pink-600',
          is_premium: true,
          lecture_count: 32,
          total_views: 4567,
          duration: '25 ساعة'
        },
        {
          id: '3',
          title: 'الكيمياء الحيوية - Biochemistry',
          description: 'دراسة التفاعلات الكيميائية في الكائنات الحية',
          image_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69',
          icon: '🧪',
          color: 'from-green-500 to-teal-600',
          is_premium: true,
          lecture_count: 28,
          total_views: 2890,
          duration: '22 ساعة'
        },
        {
          id: '4',
          title: 'علم الأمراض - Pathology',
          description: 'دراسة الأمراض وأسبابها وتأثيراتها',
          image_url: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118',
          icon: '🔬',
          color: 'from-yellow-500 to-orange-600',
          is_premium: false,
          lecture_count: 20,
          total_views: 5123,
          duration: '16 ساعة'
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
        const { data, error } = await supabase
          .from('users')
          .select('subscription_status')
          .eq('id', user.id)
          .single()
        
        if (data) {
          setUserSubscription(data.subscription_status)
        }
      }
    } catch (error) {
      console.error('Error checking subscription:', error)
    }
  }

  const handleSubjectClick = (subject: Subject) => {
    if (subject.is_premium && userSubscription !== 'active') {
      toast.error('هذه المادة مدفوعة - يرجى الاشتراك أولاً')
      router.push('/subscription')
      return
    }
    router.push(`/subjects/${subject.id}`)
  }

  const getGradientClass = (color: string) => {
    return `bg-gradient-to-br ${color}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gold rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              animate={{
                y: [null, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: Math.random() * 5 + 5,
                repeat: Infinity,
                repeatType: "loop",
                ease: "linear",
                delay: Math.random() * 5,
              }}
              style={{
                left: `${Math.random() * 100}%`,
                boxShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <div className="relative z-10 pt-24 pb-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-4xl mx-auto"
        >
          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="p-4 rounded-full bg-gradient-to-br from-gold to-yellow-600 shadow-2xl"
            >
              <Crown className="w-12 h-12 text-black" />
            </motion.div>
          </div>
          <h1 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-gold via-yellow-400 to-gold bg-clip-text text-transparent mb-4">
            المواد الدراسية
          </h1>
          <p className="text-xl text-gray-400">
            اختر المادة التي تريد دراستها من مجموعتنا المميزة
          </p>
        </motion.div>
      </div>

      {/* Subjects Grid */}
      <div className="relative z-10 container mx-auto px-4 pb-20">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {subjects.map((subject, index) => (
                <motion.div
                  key={subject.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -8 }}
                  onHoverStart={() => setHoveredCard(subject.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="relative group cursor-pointer"
                  onClick={() => handleSubjectClick(subject)}
                >
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gold/20 shadow-2xl">
                    {/* Premium Badge */}
                    {subject.is_premium && (
                      <div className="absolute top-3 right-3 z-20">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                          className="bg-gradient-to-r from-gold to-yellow-600 text-black px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1"
                        >
                          <Diamond className="w-3 h-3" />
                          Premium
                        </motion.div>
                      </div>
                    )}

                    {/* Card Image */}
                    <div className="relative h-48 overflow-hidden">
                      <div className={`absolute inset-0 ${getGradientClass(subject.color)} opacity-90`} />
                      {subject.image_url && (
                        <img 
                          src={subject.image_url}
                          alt={subject.title}
                          className="w-full h-full object-cover mix-blend-overlay"
                        />
                      )}
                      
                      {/* Hover Effect */}
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: hoveredCard === subject.id ? 1 : 0 }}
                        className="absolute inset-0 bg-black/60 flex items-center justify-center"
                      >
                        <Play className="w-16 h-16 text-gold" />
                      </motion.div>

                      {/* Icon */}
                      <div className="absolute bottom-3 left-3 text-4xl">
                        {subject.icon}
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-5 space-y-3">
                      <h3 className="text-xl font-bold text-white group-hover:text-gold transition-colors">
                        {subject.title}
                      </h3>
                      
                      <p className="text-gray-400 text-sm line-clamp-2">
                        {subject.description}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Video className="w-3 h-3" />
                          <span>{subject.lecture_count} محاضرة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{subject.duration}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          <span>{subject.total_views?.toLocaleString()} مشاهدة</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {subject.is_premium ? (
                            <Lock className="w-3 h-3 text-gold" />
                          ) : (
                            <Unlock className="w-3 h-3 text-green-500" />
                          )}
                          <span className={subject.is_premium ? 'text-gold' : 'text-green-500'}>
                            {subject.is_premium ? 'مدفوع' : 'مجاني'}
                          </span>
                        </div>
                      </div>

                      {/* Action Button */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="w-full mt-4 py-3 rounded-lg bg-gradient-to-r from-gold to-yellow-600 text-black font-bold flex items-center justify-center gap-2 shadow-lg"
                      >
                        ابدأ الدراسة
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Glow Effect */}
                    <motion.div
                      className="absolute inset-0 rounded-2xl pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: hoveredCard === subject.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                      style={{
                        background: 'radial-gradient(circle at center, rgba(255, 215, 0, 0.1) 0%, transparent 70%)',
                        boxShadow: '0 0 40px rgba(255, 215, 0, 0.3)',
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
