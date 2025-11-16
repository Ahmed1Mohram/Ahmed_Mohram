'use client'

import { useState, useEffect, useRef } from 'react'

interface UseAudioProps {
  src: string
  autoPlay?: boolean
}

// استخدام عنصر HTML Audio Element للتعامل مع ملفات الصوت
export const useAudio = ({ src, autoPlay = false }: UseAudioProps) => {
  const [playing, setPlaying] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // إنشاء عنصر الصوت مع إعدادات محسنة
    const audioElement = new Audio()
    
    // إعدادات لتحسين الأداء والتوافق
    audioElement.preload = 'auto'
    audioElement.volume = 0.7 // مستوى صوت مريح
    
    // تعيين مصدر الصوت
    audioElement.src = src
    audioRef.current = audioElement
    
    // الاستماع لأحداث الصوت
    const handleEnded = () => {
      setPlaying(false)
      console.log('انتهى تشغيل الصوت')
    }
    
    const handleError = (e: any) => {
      console.error('خطأ في تحميل الملف الصوتي:', e)
      console.error('مصدر الصوت:', src)
      setPlaying(false)
    }
    
    const handleCanPlay = () => {
      console.log('الملف الصوتي جاهز للتشغيل:', src)
    }
    
    audioElement.addEventListener('ended', handleEnded)
    audioElement.addEventListener('error', handleError)
    audioElement.addEventListener('canplay', handleCanPlay)
    
    // التشغيل التلقائي عند تحميل الصفحة
    if (autoPlay) {
      // تأخير بسيط لضمان جاهزية المتصفح
      const timeout = setTimeout(() => {
        audioElement.play()
          .then(() => {
            setPlaying(true)
            console.log('تم تشغيل الصوت تلقائياً')
          })
          .catch(err => {
            console.error('فشل التشغيل التلقائي للصوت:', err)
          })
      }, 1000) // تأخير مناسب
      
      return () => {
        clearTimeout(timeout)
        audioElement.removeEventListener('ended', handleEnded)
        audioElement.removeEventListener('error', handleError)
        audioElement.removeEventListener('canplay', handleCanPlay)
        audioElement.pause()
      }
    }
    
    return () => {
      audioElement.removeEventListener('ended', handleEnded)
      audioElement.removeEventListener('error', handleError)
      audioElement.removeEventListener('canplay', handleCanPlay)
      audioElement.pause()
    }
  }, [src, autoPlay])
  
  // التشغيل والإيقاف عند النقر على الزر
  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    
    if (playing) {
      audio.pause()
      audio.currentTime = 0
      setPlaying(false)
    } else {
      audio.currentTime = 0 // إعادة ضبط موضع التشغيل
      audio.play()
        .then(() => {
          setPlaying(true)
          console.log('تم تشغيل الصوت بنجاح')
        })
        .catch(err => {
          console.error('فشل تشغيل الصوت:', err)
        })
    }
  }
  
  return { playing, toggle }
}
