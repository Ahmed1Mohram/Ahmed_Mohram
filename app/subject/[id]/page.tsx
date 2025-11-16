'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useParams, useRouter } from 'next/navigation'
import { 
  Video, FileText, Headphones, Lock, Play, 
  ChevronLeft, Download, Eye, Clock, Star,
  CheckCircle, BookOpen, Award, Sparkles,
  MessageCircle, Share2, Heart, Bookmark, X
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Lecture {
  id: string
  title: string
  description: string
  thumbnail_url: string
  duration_minutes: number
  order_index: number
  is_free: boolean
  content: LectureContent[]
}

interface LectureContent {
  id: string
  type: 'video' | 'pdf' | 'audio'
  title: string
  content_url: string
  duration_minutes?: number
  is_downloadable: boolean
}

export default function SubjectPage() {
  const params = useParams()
  const router = useRouter()
  const subjectId = params.id as string
  
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState<any>(null)
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null)
  const [activeContent, setActiveContent] = useState<LectureContent | null>(null)

  useEffect(() => {
    fetchSubjectData()
  }, [subjectId])

  const fetchSubjectData = async () => {
    try {
      // جلب بيانات المادة
      const subjectRes = await fetch(`/api/subjects/${subjectId}`)
      const subjectData = await subjectRes.json()
      setSubject(subjectData.subject)
      
      // جلب المحاضرات
      const lecturesRes = await fetch(`/api/subjects/${subjectId}/lectures`)
      const lecturesData = await lecturesRes.json()
      setLectures(lecturesData.lectures || [])
    } catch (error) {
      toast.error('فشل جلب بيانات المادة')
    } finally {
      setLoading(false)
    }
  }

  const handleLectureClick = async (lecture: Lecture) => {
    // التحقق من الاشتراك للمحاضرات المدفوعة
    if (!lecture.is_free) {
      const res = await fetch('/api/check-subscription')
      const data = await res.json()
      if (!data.active) {
        toast.error('يجب الاشتراك لمشاهدة هذه المحاضرة')
        return
      }
    }
    
    setSelectedLecture(lecture)
    // تسجيل المشاهدة
    await fetch('/api/views', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lecture_id: lecture.id })
    })
  }

  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-5 h-5" />
      case 'pdf':
        return <FileText className="w-5 h-5" />
      case 'audio':
        return <Headphones className="w-5 h-5" />
      default:
        return <Play className="w-5 h-5" />
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gold">جاري التحميل...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <div className="luxury-gradient-bg py-12 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        
        <div className="max-w-7xl mx-auto relative z-10">
          <button 
            onClick={() => router.back()}
            className="mb-6 flex items-center gap-2 text-gold hover:text-yellow-400 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            رجوع للمواد
          </button>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-6"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-gold to-yellow-600 rounded-2xl flex items-center justify-center text-4xl shadow-2xl">
              <BookOpen className="w-10 h-10 text-black" />
            </div>
            
            <div>
              <h1 className="text-4xl font-black gradient-text-animated mb-2">
                {subject?.title}
              </h1>
              <p className="text-white/80 text-lg">{subject?.description}</p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex items-center gap-2 text-gold">
                  <Video className="w-5 h-5" />
                  <span>{lectures.length} محاضرة</span>
                </div>
                <div className="flex items-center gap-2 text-green-400">
                  <Clock className="w-5 h-5" />
                  <span>{lectures.reduce((acc, l) => acc + l.duration_minutes, 0)} دقيقة</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* قائمة المحاضرات */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-2xl font-bold gradient-text mb-4">المحاضرات</h2>
            
            <div className="space-y-3">
              {lectures.map((lecture, index) => (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  onClick={() => handleLectureClick(lecture)}
                  className={`luxury-card rounded-xl p-4 cursor-pointer transition-all ${
                    selectedLecture?.id === lecture.id 
                      ? 'border-2 border-gold shadow-gold-glow' 
                      : 'border border-white/10 hover:border-gold/50'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Thumbnail */}
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-gold/20 to-purple-600/20">
                      {lecture.thumbnail_url ? (
                        <img 
                          src={lecture.thumbnail_url} 
                          alt={lecture.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Video className="w-8 h-8 text-gold/50" />
                        </div>
                      )}
                      {!lecture.is_free && (
                        <div className="absolute top-1 right-1 bg-gold text-black p-1 rounded">
                          <Lock className="w-3 h-3" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1">
                      <h3 className="font-bold text-white mb-1">
                        المحاضرة {lecture.order_index}: {lecture.title}
                      </h3>
                      <p className="text-white/60 text-sm line-clamp-2">
                        {lecture.description}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="text-gold">
                          <Clock className="w-3 h-3 inline ml-1" />
                          {lecture.duration_minutes} دقيقة
                        </span>
                        {lecture.is_free ? (
                          <span className="text-green-400">مجاني</span>
                        ) : (
                          <span className="text-yellow-500">مدفوع</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* عارض المحتوى */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {selectedLecture ? (
                <motion.div
                  key={selectedLecture.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="luxury-card rounded-2xl p-6"
                >
                  <div className="mb-6">
                    <h2 className="text-3xl font-bold gradient-text mb-2">
                      {selectedLecture.title}
                    </h2>
                    <p className="text-white/80">{selectedLecture.description}</p>
                  </div>

                  {/* محتوى المحاضرة */}
                  <div className="space-y-4">
                    {selectedLecture.content?.map((content) => (
                      <motion.div
                        key={content.id}
                        whileHover={{ scale: 1.02 }}
                        className="glass-morphism rounded-xl p-4 cursor-pointer hover:bg-white/10 transition-all"
                        onClick={() => setActiveContent(content)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-gradient-to-br from-gold/30 to-purple-600/30 rounded-xl flex items-center justify-center text-gold">
                              {getContentIcon(content.type)}
                            </div>
                            <div>
                              <h4 className="font-bold text-white">{content.title}</h4>
                              <p className="text-white/60 text-sm">
                                {content.type === 'video' ? 'فيديو' : 
                                 content.type === 'pdf' ? 'ملف PDF' : 'ملف صوتي'}
                                {content.duration_minutes && ` - ${content.duration_minutes} دقيقة`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {content.is_downloadable && (
                              <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-gold">
                                <Download className="w-5 h-5" />
                              </button>
                            )}
                            <button className="p-2 hover:bg-white/10 rounded-lg transition-all text-green-400">
                              <Play className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Content Viewer Modal */}
                  <AnimatePresence>
                    {activeContent && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
                        onClick={() => setActiveContent(null)}
                      >
                        <motion.div
                          initial={{ scale: 0.9 }}
                          animate={{ scale: 1 }}
                          exit={{ scale: 0.9 }}
                          className="luxury-card rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-auto"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-2xl font-bold gradient-text">
                              {activeContent.title}
                            </h3>
                            <button
                              onClick={() => setActiveContent(null)}
                              className="p-2 hover:bg-white/10 rounded-lg transition-all"
                            >
                              <X className="w-6 h-6" />
                            </button>
                          </div>

                          {/* Content Display */}
                          <div className="aspect-video bg-black/50 rounded-xl overflow-hidden">
                            {activeContent.type === 'video' ? (
                              <video
                                controls
                                className="w-full h-full"
                                src={activeContent.content_url}
                              />
                            ) : activeContent.type === 'pdf' ? (
                              <iframe
                                src={activeContent.content_url}
                                className="w-full h-full"
                                title={activeContent.title}
                              />
                            ) : (
                              <audio
                                controls
                                className="w-full"
                                src={activeContent.content_url}
                              />
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="luxury-card rounded-2xl p-12 text-center">
                  <Video className="w-16 h-16 text-gold/50 mx-auto mb-4" />
                  <p className="text-white/60 text-lg">اختر محاضرة للبدء</p>
                </div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}
