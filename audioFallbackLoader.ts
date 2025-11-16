// دالة مساعدة لتحميل وتشغيل الصوت بشكل آمن مع بدائل للمتصفحات المختلفة

interface AudioOptions {
  volume?: number;
  autoplay?: boolean;
  onSuccess?: (audio: HTMLAudioElement) => void;
  onError?: (error: Error) => void;
}

/**
 * تحميل وتشغيل ملف صوتي بشكل آمن عبر مختلف المتصفحات
 * @param audioPath - مسار ملف الصوت
 * @param options - خيارات التشغيل
 * @returns - عنصر الصوت أو null إذا فشل الإنشاء
 */
export function loadAndPlayAudio(audioPath: string, options: AudioOptions = {}): HTMLAudioElement | null {
  const { volume = 0.7, autoplay = true, onSuccess, onError } = options;
  
  // التحقق من وجود متصفح (للتوافق مع SSR)
  if (typeof window === 'undefined' || typeof Audio === 'undefined') {
    console.warn('بيئة تشغيل الصوت غير متوفرة');
    if (onError) onError(new Error('بيئة تشغيل الصوت غير متوفرة'));
    return null;
  }
  
  // إنشاء عنصر الصوت
  let audioElement: HTMLAudioElement | null = null;
  try {
    audioElement = new Audio(audioPath);
    
    // إعداد خصائص الصوت
    audioElement.volume = volume;
    audioElement.preload = 'auto';
    
    // معالج الأحداث للتحميل
    audioElement.addEventListener('canplaythrough', () => {
      console.log(`✅ ملف الصوت "${audioPath}" جاهز للتشغيل`);
    });
    
    // محاولة التشغيل إذا كان autoplay مفعلاً
    if (autoplay) {
      // طريقة 1: تقنية muted ثم unmuted (لتجاوز قيود المتصفح)
      audioElement.muted = true;
      const playPromise = audioElement.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // إنجاح التشغيل، إزالة كتم الصوت بعد لحظة
            setTimeout(() => {
              if (audioElement) {
                audioElement.muted = false;
                if (onSuccess && audioElement) onSuccess(audioElement);
              }
            }, 100);
          })
          .catch((err: Error) => {
            console.warn(`⚠️ فشل التشغيل التلقائي: ${err.message}`);
            
            // طريقة 2: التشغيل عند التفاعل
            const playOnInteraction = () => {
              if (audioElement) {
                audioElement.muted = false;
                audioElement.play()
                  .then(() => {
                    if (onSuccess && audioElement) onSuccess(audioElement);
                  })
                  .catch((e: Error) => {
                    console.error(`فشل التشغيل عند التفاعل: ${e.message}`);
                    if (onError) onError(e);
                  });
              }
              
              // إزالة مستمعي الأحداث بعد الاستخدام
              ['click', 'touchstart', 'keydown'].forEach(event => {
                document.removeEventListener(event, playOnInteraction);
              });
            };
            
            // إضافة مستمعي الأحداث للتفاعل
            ['click', 'touchstart', 'keydown'].forEach(event => {
              document.addEventListener(event, playOnInteraction, { once: true });
            });
            
            // إبلاغ الاستدعاء الخارجي بالخطأ
            if (onError) onError(err);
          });
      }
    }
    
  } catch (error: any) {
    console.error(`خطأ في إنشاء عنصر الصوت: ${error.message}`);
    if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    return null;
  }
  
  return audioElement;
}

/**
 * تنظيف موارد الصوت
 * @param audioElement - عنصر الصوت للتنظيف
 */
export function cleanupAudio(audioElement: HTMLAudioElement | null): void {
  if (audioElement) {
    audioElement.pause();
    audioElement.src = '';
    audioElement.remove();
  }
}
