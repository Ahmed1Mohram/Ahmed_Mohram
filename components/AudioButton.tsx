'use client'

import { useEffect, useState } from 'react'
import { useAudio } from './useAudio'

// مكون الصوت مع تحسينات للتوافق مع سياسات المتصفح الحديثة
const AudioButton = () => {
  const [soundFile, setSoundFile] = useState('/audio/welcome-sound.mp3')
  const [canAutoPlay, setCanAutoPlay] = useState(false)
  
  // التحقق من وجود الملف قبل محاولة تشغيله
  useEffect(() => {
    // التحقق من وجود ملفات صوت مختلفة
    const checkFiles = async () => {
      const filesToCheck = [
        '/audio/welcome-sound.mp3',
        '/audio/welcome.mp3',
        '/welcome-sound.mp3',
        '/welcome.mp3',
        '/audio/منصه-enhanced-v2.wav'
      ];
      
      for (const file of filesToCheck) {
        try {
          // محاولة الوصول للملف للتحقق من وجوده
          const response = await fetch(file, { method: 'HEAD' });
          if (response.ok) {
            setSoundFile(file);
            console.log('تم العثور على ملف الصوت:', file);
            break;
          }
        } catch (err) {
          console.log('لم يتم العثور على ملف الصوت:', file);
        }
      }
    };
    
    // التحقق من دعم التشغيل التلقائي
    const checkAutoPlaySupport = async () => {
      try {
        // قد يسمح المتصفح بالتشغيل التلقائي بدون صوت (مكتوم)
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const autoPlayAllowed = await audioContext.state === 'running';
        setCanAutoPlay(autoPlayAllowed);
        console.log('دعم التشغيل التلقائي:', autoPlayAllowed ? 'مدعوم' : 'غير مدعوم');
      } catch (err) {
        console.log('خطأ في التحقق من دعم التشغيل التلقائي');
        setCanAutoPlay(false);
      }
    };
    
    // الاستماع لتفاعل المستخدم لتمكين الصوت بعدها
    const enableAudioOnInteraction = () => {
      setCanAutoPlay(true);
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
    };
    
    checkFiles();
    checkAutoPlaySupport();
    
    // إضافة الاستماع للنقر
    document.addEventListener('click', enableAudioOnInteraction);
    document.addEventListener('touchstart', enableAudioOnInteraction);
    
    return () => {
      document.removeEventListener('click', enableAudioOnInteraction);
      document.removeEventListener('touchstart', enableAudioOnInteraction);
    };
  }, []);
  
  // استخدام هوك الصوت
  const { playing, toggle } = useAudio({ 
    src: soundFile,
    autoPlay: false // لا نستخدم التشغيل التلقائي المباشر بسبب قيود المتصفح
  });

  // إنشاء صوت بسيط كبديل
  const createSimpleBeep = () => {
    try {
      const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.3);
      
      console.log('تم تشغيل صوت بسيط بنجاح');
    } catch (err) {
      console.error('فشل في إنشاء الصوت:', err);
    }
  };

  // تشغيل الصوت عند أول تفاعل من المستخدم
  useEffect(() => {
    let hasPlayed = false;
    
    const playWelcomeSound = () => {
      if (!hasPlayed) {
        hasPlayed = true;

        // محاولة تشغيل الملف الصوتي أولاً
        toggle();
        
        // إذا فشل، استخدم الصوت البسيط كبديل
        setTimeout(() => {
          if (!playing) {
            createSimpleBeep();
          }
        }, 1000);
        
        console.log('تم تشغيل صوت الترحيب عند التفاعل الأول');
      }
    };
    
    // إضافة الاستماع لأول تفاعل
    document.addEventListener('click', playWelcomeSound, { once: true });
    document.addEventListener('touchstart', playWelcomeSound, { once: true });
    document.addEventListener('keydown', playWelcomeSound, { once: true });
    
    return () => {
      document.removeEventListener('click', playWelcomeSound);
      document.removeEventListener('touchstart', playWelcomeSound);
      document.removeEventListener('keydown', playWelcomeSound);
    };
  }, [canAutoPlay, toggle, playing]);

  useEffect(() => {
    console.log('حالة الصوت:', playing ? 'يعمل' : 'متوقف');
    console.log('ملف الصوت المستخدم:', soundFile);
  }, [playing, soundFile]);

  // عرض زر صوتي في حالة عدم تشغيل الصوت تلقائياً
  if (!playing && canAutoPlay) {
    return (
      <button
        onClick={toggle}
        className="fixed bottom-6 right-6 z-50 p-3 bg-gradient-to-r from-gold to-yellow-500 text-black rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        title="تشغيل صوت الترحيب"
      >
        <svg 
          className="w-6 h-6" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path d="M18 3a1 1 0 00-1.196-.98L8 3.93v11.14l8.804 1.91A1 1 0 0018 16V3zM6 5.07V16.93A1 1 0 005.804 17L1.196 15.98A1 1 0 011 15V5a1 1 0 011.196-.98L6 5.07z"/>
        </svg>
      </button>
    );
  }
  
  return null;
}

export default AudioButton
