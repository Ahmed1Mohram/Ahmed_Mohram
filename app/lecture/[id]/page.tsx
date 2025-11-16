'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { 
  ArrowLeft, Video, FileText, Headphones, Download, 
  Play, Pause, Volume2, Maximize2, Eye, Clock,
  CheckCircle, ChevronLeft, ChevronRight, BookOpen,
  Share2, Heart, MessageCircle, Award, X
} from 'lucide-react'
import { supabase } from '@/components/providers'
import toast from 'react-hot-toast'

// نوع المحتوى
interface LectureContent {
  id: string
  type: 'video' | 'pdf' | 'audio' | 'text'
  title: string
  content_url?: string
  content_text?: string
  duration_minutes?: number
  order_index: number
  is_downloadable: boolean
}

interface Lecture {
  id: string
  title: string
  description: string
  subject?: {
    title: string
    id: string
  }
  lecture_content?: LectureContent[]
}

export default function LecturePage() {
  const router = useRouter()
  const params = useParams()
  const lectureId = params.id as string
  
  const [lecture, setLecture] = useState<Lecture | null>(null)
  const [contents, setContents] = useState<LectureContent[]>([])
  const [selectedContent, setSelectedContent] = useState<LectureContent | null>(null)
  const [activeTab, setActiveTab] = useState<'video' | 'pdf' | 'audio' | 'text'>('video')
  const [loading, setLoading] = useState(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPdfViewer, setShowPdfViewer] = useState(false)
  const searchParams = useSearchParams()

  useEffect(() => {
    if (lectureId) {
      fetchLectureData()
    }
  }, [lectureId])

  const fetchLectureData = async () => {
    try {
      const { data, error } = await supabase
        .from('lectures')
        .select(`
          *,
          subject:subjects(id, title),
          lecture_content(*)
        `)
        .eq('id', lectureId)
        .maybeSingle()

      if (error) throw error
      
      setLecture(data)
      const sortedContent = data?.lecture_content?.sort((a: LectureContent, b: LectureContent) => a.order_index - b.order_index) || []
      setContents(sortedContent)
      
      // Respect ?type= query if provided, else pick first
      const desired = (searchParams?.get('type') as 'video' | 'audio' | 'pdf' | 'text' | null) || null
      const preferred = desired ? sortedContent.find((c: LectureContent) => c.type === desired) : null
      const first = preferred || sortedContent[0]
      if (first) {
        setSelectedContent(first)
        setActiveTab((first.type as any))
      }
    } catch (error) {
      console.error('Error fetching lecture:', error)
      
      // بيانات تجريبية
      const demoData: Lecture = {
        id: lectureId,
        title: 'الجهاز الهيكلي - العظام والمفاصل',
        description: 'في هذه المحاضرة سنتعرف على تركيب العظام والمفاصل ووظائفها المختلفة في جسم الإنسان',
        subject: {
          id: '1',
          title: 'علم التشريح - Anatomy'
        }
      }
      
      const demoContent: LectureContent[] = [
        {
          id: '1',
          type: 'video',
          title: 'فيديو المحاضرة',
          content_url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          duration_minutes: 45,
          order_index: 1,
          is_downloadable: false
        },
        {
          id: '2',
          type: 'pdf',
          title: 'ملف PDF - ملخص المحاضرة',
          content_url: '/sample.pdf',
          order_index: 2,
          is_downloadable: true
        },
        {
          id: '3',
          type: 'audio',
          title: 'التسجيل الصوتي للمحاضرة',
          content_url: '/sample.mp3',
          duration_minutes: 45,
          order_index: 3,
          is_downloadable: true
        }
      ]
      
      setLecture(demoData)
      setContents(demoContent)
      if (demoContent.length > 0) {
        setSelectedContent(demoContent[0])
        setActiveTab(demoContent[0].type as any)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleContentClick = (content: LectureContent) => {
    setSelectedContent(content)
    setActiveTab(content.type as any)
  }

  const handleDownload = async (content: LectureContent) => {
    if (!content.is_downloadable) {
      toast.error('هذا المحتوى غير قابل للتحميل')
      return
    }
    
    if (content.content_url) {
      if (typeof window !== 'undefined') {
        window.open(content.content_url, '_blank')
        toast.success('جاري تحميل الملف...')
      }
    }
  }

  const getContentIcon = (type: string) => {
    switch(type) {
      case 'video': return <Video className="w-5 h-5" />
      case 'pdf': return <FileText className="w-5 h-5" />
      case 'audio': return <Headphones className="w-5 h-5" />
      default: return <BookOpen className="w-5 h-5" />
    }
  }

  const getContentTypeLabel = (type: string) => {
    switch(type) {
      case 'video': return 'فيديو'
      case 'pdf': return 'PDF'
      case 'audio': return 'صوتي'
      case 'text': return 'شرح'
      default: return 'نص'
    }
  }

  // Ensure active tab is valid if contents change
  useEffect(() => {
    const types = Array.from(new Set(contents.map(c => c.type)))
    if (types.length > 0 && !types.includes(activeTab)) {
      setActiveTab(types[0] as any)
      const firstOfType = contents.find(c => c.type === types[0])
      if (firstOfType) setSelectedContent(firstOfType)
    }
  }, [contents])

  return (
    <div className="min-h-screen bg-black">
      {loading ? (
        <div className="flex justify-center items-center h-screen">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row h-screen">
          {/* Main Content Area */}
          <div className="flex-1 flex flex-col">
            {/* Header */}
            <div className="bg-gradient-to-b from-gray-900 to-black border-b border-gold/20 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => router.back()}
                    className="p-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold transition-colors"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div>
                    <h1 className="text-xl font-bold text-white">{lecture?.title}</h1>
                    <p className="text-sm text-gray-400">
                      {lecture?.subject?.title}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button className="p-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold transition-colors">
                    <Share2 className="w-5 h-5" />
                  </button>
                  <button className="p-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold transition-colors">
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content Viewer */}
            <div className="flex-1 relative bg-gray-950 overflow-hidden">
              <AnimatePresence mode="wait">
                {selectedContent && (
                  <motion.div
                    key={selectedContent.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="w-full h-full"
                  >
                    {/* Video Player */}
                    {selectedContent.type === 'video' && (
                      <div className="w-full h-full flex items-center justify-center bg-black">
                        {selectedContent.content_url?.includes('youtube') ? (
                          <iframe
                            src={selectedContent.content_url}
                            className="w-full h-full"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={selectedContent.content_url}
                            controls
                            className="w-full h-full"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                          />
                        )}
                      </div>
                    )}

                    {/* Text Viewer */}
                    {selectedContent.type === 'text' && (
                      <div className="w-full h-full overflow-y-auto p-6">
                        <div className="max-w-3xl mx-auto">
                          <h3 className="text-2xl font-bold text-white mb-4">{selectedContent.title}</h3>
                          <div className="bg-gray-900/60 border border-gold/20 rounded-xl p-5 text-white/90 leading-8 whitespace-pre-wrap">
                            {selectedContent.content_text || 'لا يوجد نص متاح لهذه المحاضرة حالياً'}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* PDF Viewer */}
                    {selectedContent.type === 'pdf' && (
                      <div className="w-full h-full flex flex-col items-center justify-center">
                        <div className="text-center mb-6">
                          <FileText className="w-24 h-24 text-gold/30 mx-auto mb-4" />
                          <h3 className="text-2xl font-bold text-white mb-2">{selectedContent.title}</h3>
                          <p className="text-gray-400">ملف PDF جاهز للعرض</p>
                        </div>
                        <div className="flex gap-4">
                          <button
                            onClick={() => setShowPdfViewer(true)}
                            className="px-6 py-3 bg-gold text-black font-bold rounded-lg hover:bg-yellow-600 transition-colors"
                          >
                            عرض الملف
                          </button>
                          {selectedContent.is_downloadable && (
                            <button
                              onClick={() => handleDownload(selectedContent)}
                              className="px-6 py-3 bg-gray-800 text-white font-bold rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                            >
                              <Download className="w-5 h-5" />
                              تحميل
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Audio Player */}
                    {selectedContent.type === 'audio' && (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="mb-8">
                            <motion.div
                              animate={{ scale: isPlaying ? [1, 1.2, 1] : 1 }}
                              transition={{ duration: 1, repeat: isPlaying ? Infinity : 0 }}
                              className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gold to-yellow-600 flex items-center justify-center"
                            >
                              <Headphones className="w-16 h-16 text-black" />
                            </motion.div>
                            <h3 className="text-2xl font-bold text-white mb-2">{selectedContent.title}</h3>
                            <p className="text-gray-400">
                              {selectedContent.duration_minutes ? `${selectedContent.duration_minutes} دقيقة` : 'تسجيل صوتي'}
                            </p>
                          </div>
                          <audio
                            src={selectedContent.content_url}
                            controls
                            className="w-full max-w-md"
                            onPlay={() => setIsPlaying(true)}
                            onPause={() => setIsPlaying(false)}
                          />
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sidebar - Content List */}
          <div className="w-full lg:w-96 bg-gray-900 border-l border-gold/20 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-lg font-bold text-white mb-4">محتوى المحاضرة</h2>
              
              {/* Content Tabs */}
              <div className="flex gap-2 mb-4">
                {Array.from(new Set(contents.map(c => c.type))).map((type: any) => {
                  const contentOfType = contents.filter(c => c.type === type)
                  if (contentOfType.length === 0) return null
                  return (
                    <button
                      key={type}
                      onClick={() => setActiveTab(type as any)}
                      className={`flex-1 py-2 px-3 rounded-lg font-medium transition-all ${
                        activeTab === type
                          ? 'bg-gold text-black'
                          : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                      }`}
                    >
                      {getContentTypeLabel(type)} ({contentOfType.length})
                    </button>
                  )
                })}
              </div>

              {/* Content List */}
              <div className="space-y-2">
                {contents
                  .filter(content => content.type === activeTab)
                  .map((content, index) => (
                    <motion.div
                      key={content.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => handleContentClick(content)}
                      className={`p-4 rounded-lg cursor-pointer transition-all ${
                        selectedContent?.id === content.id
                          ? 'bg-gold/20 border border-gold'
                          : 'bg-gray-800 hover:bg-gray-700 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${
                          selectedContent?.id === content.id ? 'bg-gold text-black' : 'bg-gray-700 text-gold'
                        }`}>
                          {getContentIcon(content.type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-white mb-1">{content.title}</h4>
                          {content.duration_minutes && (
                            <p className="text-xs text-gray-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {content.duration_minutes} دقيقة
                            </p>
                          )}
                          {content.is_downloadable && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDownload(content)
                              }}
                              className="mt-2 text-xs text-gold hover:text-yellow-400 flex items-center gap-1"
                            >
                              <Download className="w-3 h-3" />
                              تحميل
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PDF Viewer Modal */}
      {showPdfViewer && selectedContent?.type === 'pdf' && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl h-full max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <button
              onClick={() => setShowPdfViewer(false)}
              className="absolute top-4 right-4 z-10 p-2 rounded-lg bg-red-500 text-white hover:bg-red-600"
            >
              <X className="w-5 h-5" />
            </button>
            <iframe
              src={selectedContent.content_url}
              className="w-full h-full"
              title="PDF Viewer"
            />
          </div>
        </div>
      )}
    </div>
  )
}
