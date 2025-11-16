import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, Clock, CheckCircle, BarChart2, 
  Play, Eye, Award, TrendingUp
} from 'lucide-react';
import { useAuth } from './providers';
import toast from 'react-hot-toast';

// واجهة بيانات الإحصائيات
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

// واجهة بيانات المشاهدة
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
    thumbnail_url?: string;
  };
  lecture_content?: {
    id: string;
    title: string;
    type: string;
  };
}

const StudentStats = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [recentViews, setRecentViews] = useState<ViewData[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchStats();
    }
  }, [user]);

  // جلب إحصائيات الطالب
  const fetchStats = async () => {
    setLoading(true);
    try {
      // تجهيز بيانات المستخدم ليتم إرسالها في الهيدرز
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
        setStats(data.stats);
        setRecentViews(data.recent_views || []);
      } else {
        throw new Error(data.error || 'حدث خطأ أثناء جلب البيانات');
      }
    } catch (error: any) {
      console.error('Error fetching student stats:', error);
      toast.error(error.message || 'فشل في جلب إحصائيات المشاهدة');
    } finally {
      setLoading(false);
    }
  };

  // تنسيق الوقت (مثال: تحويل 125 دقيقة إلى ساعتين و5 دقائق)
  const formatTime = (minutes: number) => {
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
  
  // اختيار لون بناءً على التقدم
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-yellow-500';
    return 'bg-rose-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-black/80 rounded-xl p-6 text-center">
        <Eye className="w-12 h-12 text-white/30 mx-auto mb-3" />
        <p className="text-white/50">لا توجد إحصائيات متاحة</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* عنوان القسم */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold gradient-text-gold">إحصائيات المشاهدة</h2>
        <button 
          onClick={fetchStats}
          className="p-2 rounded-lg hover:bg-white/10 transition-all"
          title="تحديث"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold">
            <path d="M21 2v6h-6"></path>
            <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
            <path d="M3 22v-6h6"></path>
            <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
          </svg>
        </button>
      </div>

      {/* بطاقات الإحصائيات الرئيسية */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-morphism border border-gold/20 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-gold/20 to-amber-700/20 border border-gold/30">
              <Eye className="w-6 h-6 text-gold" />
            </div>
            <div>
              <p className="text-white/60 text-sm">إجمالي المشاهدات</p>
              <p className="text-2xl font-bold text-white">{stats.total_views}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/50 text-sm">
              شاهدت {stats.unique_lectures_viewed} محاضرة من أصل {stats.total_available_lectures}
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-morphism border border-gold/20 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-700/20 border border-green-500/30">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <div>
              <p className="text-white/60 text-sm">المحتوى المكتمل</p>
              <p className="text-2xl font-bold text-white">{stats.completed_views}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={`h-full ${getProgressColor(stats.completion_rate)}`} 
                style={{ width: `${stats.completion_rate}%` }}
              ></div>
            </div>
            <p className="text-white/50 text-sm mt-1">نسبة الإكمال: {stats.completion_rate}%</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-morphism border border-gold/20 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500/20 to-indigo-700/20 border border-blue-500/30">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-white/60 text-sm">وقت المشاهدة</p>
              <p className="text-2xl font-bold text-white">{stats.total_view_time_minutes}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/50 text-sm">
              {formatTime(stats.total_view_time_minutes)}
            </p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-morphism border border-gold/20 rounded-xl p-5"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-fuchsia-700/20 border border-purple-500/30">
              <TrendingUp className="w-6 h-6 text-purple-500" />
            </div>
            <div>
              <p className="text-white/60 text-sm">المواد الدراسية</p>
              <p className="text-2xl font-bold text-white">{stats.subject_progress.length}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/10">
            <p className="text-white/50 text-sm">
              تقدم في {stats.subject_progress.length} مادة دراسية
            </p>
          </div>
        </motion.div>
      </div>

      {/* آخر المشاهدات */}
      {recentViews.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">آخر المشاهدات</h3>
          
          <div className="space-y-3">
            {recentViews.map((view) => (
              <motion.div
                key={view.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-all border border-white/5"
              >
                <div className="w-14 h-14 bg-black/40 rounded-lg flex items-center justify-center overflow-hidden relative">
                  {view.lectures.thumbnail_url ? (
                    <img 
                      src={view.lectures.thumbnail_url} 
                      alt={view.lectures.title} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen className="w-6 h-6 text-white/40" />
                  )}
                  {view.completed && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1">
                  <p className="font-bold text-white">{view.lectures.title}</p>
                  {view.lecture_content && (
                    <p className="text-white/60 text-sm">{view.lecture_content.title}</p>
                  )}
                </div>
                
                <div className="text-left">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-20 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${getProgressColor(view.progress)}`} 
                        style={{ width: `${view.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-xs text-white/60">{Math.round(view.progress)}%</span>
                  </div>
                  <p className="text-white/40 text-xs">{formatDate(view.last_viewed_at)}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
      
      {/* روابط للمزيد */}
      <div className="flex justify-center mt-8">
        <a 
          href="/dashboard/views" 
          className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-all flex items-center gap-2"
        >
          <Eye className="w-4 h-4" />
          عرض جميع المشاهدات
        </a>
      </div>
    </div>
  );
};

export default StudentStats;
