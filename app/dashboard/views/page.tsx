'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Clock, CheckCircle, Filter, Search,
  Play, Eye, ChevronLeft, Calendar, ArrowRight
} from 'lucide-react';
import { useAuth } from '@/components/providers';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface ViewData {
  id: string;
  lecture_id: string;
  content_id?: string;
  progress: number;
  completed: boolean;
  last_viewed_at: string;
  total_time_watched: number;
  lectures: {
    id: string;
    title: string;
    subject_id?: string;
    thumbnail_url?: string;
  };
  lecture_content?: {
    id: string;
    title: string;
    type: string;
  };
}

interface StatsData {
  total_views: number;
  unique_lectures_viewed: number;
  unique_content_viewed: number;
  completed_views: number;
  total_view_time_minutes: number;
  total_available_lectures: number;
  total_available_content: number;
  completion_rate: number;
  subject_progress: any[];
}

export default function ViewsPage() {
  const [loading, setLoading] = useState(true);
  const [views, setViews] = useState<ViewData[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      fetchViews();
    }
  }, [user]);
  
  const fetchViews = async () => {
    setLoading(true);
    try {
      const userData = localStorage.getItem('user');
      
      const response = await fetch('/api/student-stats', {
        headers: {
          'Content-Type': 'application/json',
          'x-user-data': userData || ''
        }
      });
      
      if (!response.ok) {
        throw new Error('فشل في جلب البيانات');
      }
      
      const data = await response.json();
      
      if (data.success) {
        setViews(data.all_views || []);
        setStats(data.stats);
      } else {
        throw new Error(data.error || 'حدث خطأ أثناء جلب البيانات');
      }
    } catch (error: any) {
      console.error('Error fetching views:', error);
      toast.error(error.message || 'فشل في جلب سجل المشاهدات');
    } finally {
      setLoading(false);
    }
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // تنسيق الوقت (مثال: تحويل 125 دقيقة إلى ساعتين و5 دقائق)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    
    if (minutes < 60) {
      return `${minutes} دقيقة`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (remainingMinutes === 0) {
      return `${hours} ساعة`;
    }
    
    return `${hours} ساعة و ${remainingMinutes} دقيقة`;
  };
  
  // تصفية المشاهدات حسب النوع
  const filteredViews = views.filter(view => {
    // تصفية حسب الحالة
    if (filterType === 'completed' && !view.completed) return false;
    if (filterType === 'in-progress' && view.completed) return false;
    
    // تصفية حسب البحث
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const lectureTitle = view.lectures?.title?.toLowerCase() || '';
      const contentTitle = view.lecture_content?.title?.toLowerCase() || '';
      
      return lectureTitle.includes(query) || contentTitle.includes(query);
    }
    
    return true;
  });
  
  // ترتيب المشاهدات حسب التاريخ (الأحدث أولاً)
  const sortedViews = [...filteredViews].sort((a, b) => {
    return new Date(b.last_viewed_at).getTime() - new Date(a.last_viewed_at).getTime();
  });
  
  // اختيار لون بناءً على التقدم
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-rose-500';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* هيدر الصفحة */}
      <div className="mb-8">
        <Link 
          href="/dashboard" 
          className="flex items-center text-white/60 hover:text-white mb-4 transition-all"
        >
          <ChevronLeft className="w-5 h-5 ml-1" />
          العودة للوحة التحكم
        </Link>
        
        <h1 className="text-3xl font-bold gradient-text-gold mb-2">سجل المشاهدات</h1>
        <p className="text-white/60">
          هنا يمكنك متابعة جميع المحاضرات والدروس التي شاهدتها
        </p>
      </div>
      
      {/* إحصائيات مصغرة */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-morphism border border-gold/20 rounded-lg p-4 text-center">
            <Eye className="w-5 h-5 text-gold mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.total_views}</p>
            <p className="text-white/60 text-sm">إجمالي المشاهدات</p>
          </div>
          <div className="glass-morphism border border-gold/20 rounded-lg p-4 text-center">
            <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.completed_views}</p>
            <p className="text-white/60 text-sm">الدروس المكتملة</p>
          </div>
          <div className="glass-morphism border border-gold/20 rounded-lg p-4 text-center">
            <Clock className="w-5 h-5 text-blue-500 mx-auto mb-1" />
            <p className="text-2xl font-bold">{stats.total_view_time_minutes}</p>
            <p className="text-white/60 text-sm">دقائق المشاهدة</p>
          </div>
          <div className="glass-morphism border border-gold/20 rounded-lg p-4 text-center">
            <Calendar className="w-5 h-5 text-purple-500 mx-auto mb-1" />
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(stats.completion_rate)}`} 
                style={{ width: `${stats.completion_rate}%` }}
              ></div>
            </div>
            <p className="text-white/60 text-sm mt-1">نسبة الإكمال: {stats.completion_rate}%</p>
          </div>
        </div>
      )}
      
      {/* أدوات البحث والتصفية */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* البحث */}
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-white/40 w-5 h-5" />
          <input
            type="text"
            placeholder="البحث في المشاهدات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 pl-4 pr-10 rounded-xl bg-black/20 border border-white/10 text-white focus:outline-none focus:border-gold/50 transition-all"
          />
        </div>
        
        {/* تصفية */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button 
              onClick={() => setFilterType('all')}
              className={`px-3 py-2 ${filterType === 'all' ? 'bg-gold/20 text-gold' : 'bg-black/20 text-white/60 hover:bg-white/10'} transition-all`}
            >
              الكل
            </button>
            <button 
              onClick={() => setFilterType('completed')}
              className={`px-3 py-2 ${filterType === 'completed' ? 'bg-green-500/20 text-green-500' : 'bg-black/20 text-white/60 hover:bg-white/10'} transition-all`}
            >
              المكتملة
            </button>
            <button 
              onClick={() => setFilterType('in-progress')}
              className={`px-3 py-2 ${filterType === 'in-progress' ? 'bg-yellow-500/20 text-yellow-500' : 'bg-black/20 text-white/60 hover:bg-white/10'} transition-all`}
            >
              قيد التقدم
            </button>
          </div>
          
          <button
            onClick={fetchViews}
            className="p-2 rounded-lg border border-white/20 hover:bg-white/10 transition-all"
            title="تحديث"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
        </div>
      </div>
      
      {/* قائمة المشاهدات */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {sortedViews.length > 0 ? (
            <div className="space-y-4">
              {sortedViews.map((view, index) => (
                <motion.div
                  key={view.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-morphism border border-white/10 rounded-xl p-4 hover:border-gold/30 transition-all"
                >
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* صورة المحاضرة */}
                    <div className="w-full md:w-36 h-24 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden relative">
                      {view.lectures.thumbnail_url ? (
                        <img 
                          src={view.lectures.thumbnail_url} 
                          alt={view.lectures.title} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <BookOpen className="w-8 h-8 text-white/40" />
                      )}
                      
                      {view.completed && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-500" />
                        </div>
                      )}
                    </div>
                    
                    {/* تفاصيل المشاهدة */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {view.lectures.title}
                      </h3>
                      
                      {view.lecture_content && (
                        <p className="text-white/70 mb-2">
                          {view.lecture_content.title}
                          <span className="mr-2 px-2 py-0.5 bg-white/10 text-xs rounded-full">
                            {view.lecture_content.type === 'video' ? 'فيديو' : 
                             view.lecture_content.type === 'pdf' ? 'ملف PDF' :
                             view.lecture_content.type === 'audio' ? 'ملف صوتي' :
                             view.lecture_content.type === 'text' ? 'نص' :
                             view.lecture_content.type === 'quiz' ? 'اختبار' : 
                             view.lecture_content.type}
                          </span>
                        </p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-white/60">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{formatTime(view.total_time_watched)}</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{formatDate(view.last_viewed_at)}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${getProgressColor(view.progress)}`} 
                              style={{ width: `${view.progress}%` }}
                            ></div>
                          </div>
                          <span>{Math.round(view.progress)}% مكتمل</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* زر متابعة المشاهدة */}
                    <div className="flex items-center">
                      <Link 
                        href={`/lectures/${view.lecture_id}${view.content_id ? `?content=${view.content_id}` : ''}`}
                        className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold/80 to-amber-600/80 hover:from-gold hover:to-amber-600 text-black font-bold flex items-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        متابعة
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-morphism border border-white/10 rounded-xl">
              <Eye className="w-16 h-16 text-white/20 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">لا توجد مشاهدات</h3>
              <p className="text-white/60 mb-6">لم تقم بمشاهدة أي محتوى بعد</p>
              <Link
                href="/lectures"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-gold/80 to-amber-600/80 hover:from-gold hover:to-amber-600 text-black font-bold inline-flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                استكشاف المحاضرات
              </Link>
            </div>
          )}
          
          {/* إظهار عدد النتائج */}
          {sortedViews.length > 0 && (
            <div className="text-center mt-6 text-white/40 text-sm">
              تم العثور على {sortedViews.length} نتيجة
              {filterType !== 'all' && (
                <button 
                  onClick={() => setFilterType('all')} 
                  className="text-gold hover:underline mr-2"
                >
                  إظهار الكل
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
