'use client'

import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { loadAndPlayAudio, cleanupAudio } from '../audioFallbackLoader.ts'

export default function SplashScreen({ onComplete }: { onComplete: () => void }) {
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  
  useEffect(() => {
    // تشغيل ملف صوت اول.mp3 تلقائياً
    let audioElement: HTMLAudioElement | null = null;

    // استخدام الدالة المساعدة لتحميل وتشغيل الصوت بشكل آمن
    audioElement = loadAndPlayAudio('/audio/اول.mp3', {
      volume: 0.7,
      autoplay: true,
      onSuccess: () => {
        console.log('✅ تم تشغيل صوت اول.mp3 بنجاح');
        setAudioPlaying(true);
      },
      onError: (err) => {
        console.warn('⚠️ فشل تشغيل الصوت الأول:', err.message);
        // الاستمرار في البرنامج حتى لو فشل الصوت
        setAudioPlaying(true); 
      }
    });
    
    setAudioPlaying(true);
    
    // تأجيل بدء شاشة الخروج
    const exitTimer = setTimeout(() => {
      setIsExiting(true)
    }, 4000)
    
    // تشغيل الصوت الثاني قبل انتهاء الشاشة بثانية
    const secondAudioTimer = setTimeout(() => {
      // استخدام الدالة المساعدة لتشغيل الصوت الثاني
      loadAndPlayAudio('/audio/ثاني.mp3', {
        volume: 0.7,
        autoplay: true,
        onSuccess: () => {
          console.log('✅ تم تشغيل صوت ثاني.mp3 قبل انتهاء SplashScreen');
        },
        onError: (err) => {
          console.warn('⚠️ فشل تشغيل الصوت الثاني:', err.message);
        }
      });
    }, 4500) // قبل الانتهاء بثانية (5500 - 1000 = 4500)
    
    // إكمال بعد الرسوم المتحركة
    const timer = setTimeout(() => {
      onComplete()
    }, 5500)
    
    // تنظيف كل المؤقتات والموارد عند تفكيك المكون
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(secondAudioTimer);
      clearTimeout(timer);
      
      // استخدام دالة تنظيف الصوت لإدارة الموارد بشكل صحيح
      if (audioElement) {
        cleanupAudio(audioElement);
        audioElement = null;
      }
    }
  }, [onComplete])
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ 
          opacity: 0,
          filter: "blur(10px)",
          transition: { 
            duration: 1.5, 
            ease: [0.43, 0.13, 0.23, 0.96],
            opacity: { duration: 1.2 },
            filter: { duration: 1.5, delay: 0.2 }
          }
        }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      >
        {/* Animated Background Pattern */}
        <div className="absolute inset-0">
          {/* Gold particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-gold to-gold-light rounded-full"
              initial={{
                x: Math.random() * 1000, // استخدام قيمة ثابتة بدلاً من window.innerWidth
                y: 1080 + 100, // استخدام قيمة ثابتة بدلاً من window.innerHeight
                opacity: 0
              }}
              animate={{
                y: -100,
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                delay: Math.random() * 2,
                repeat: Infinity,
                ease: "linear"
              }}
              style={{
                boxShadow: '0 0 10px rgba(255, 215, 0, 0.8)',
              }}
              suppressHydrationWarning={true}
            />
          ))}
          
          {/* Luxury gradient overlay */}
          <div className="absolute inset-0 bg-gradient-radial from-black via-gray-900 to-black opacity-50" />
        </div>
        
        {/* Main Content */}
        <motion.div 
          className="relative text-center"
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ duration: 1 }}
        >
          {/* Premium Logo Animation */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              duration: 1.2, 
              type: "spring",
              stiffness: 100,
              damping: 15
            }}
            className="mb-8"
          >
            <div className="relative inline-block">
              {/* Glowing ring effect */}
              <motion.div
                className="absolute inset-0 rounded-full"
                animate={{
                  boxShadow: [
                    "0 0 20px rgba(255, 215, 0, 0)",
                    "0 0 60px rgba(255, 215, 0, 0.5)",
                    "0 0 100px rgba(255, 215, 0, 0.8)",
                    "0 0 60px rgba(255, 215, 0, 0.5)",
                    "0 0 20px rgba(255, 215, 0, 0)",
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              />
              
              {/* Logo emblem */}
              <div className="w-32 h-32 bg-gradient-to-br from-gold via-gold-light to-gold-dark rounded-full flex items-center justify-center shadow-2xl">
                <div className="w-28 h-28 bg-black rounded-full flex items-center justify-center">
                  <span className="text-4xl font-bold bg-gradient-to-r from-gold via-gold-light to-gold bg-clip-text text-transparent">
                    AM
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
          
          {/* Name Animation */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mb-4"
          >
            <motion.h1 
              className="text-7xl md:text-8xl font-black tracking-wider relative inline-block"
              style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFC107 25%, #FFF59D 50%, #FFD700 75%, #FFC107 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 80px rgba(255, 215, 0, 0.5)',
                fontFamily: 'Cairo, sans-serif'
              }}
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              أحمد محرم
            </motion.h1>
            
            {/* Luxury underline */}
            <motion.div
              className="h-1 bg-gradient-to-r from-transparent via-gold to-transparent mt-4"
              initial={{ width: 0 }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, delay: 1 }}
            />
          </motion.div>
          
          {/* Welcome Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1.5 }}
            className="text-2xl md:text-3xl text-gold-light font-light tracking-widest mb-8"
            style={{ fontFamily: 'Cairo, sans-serif' }}
          >
            مرحباً بك
          </motion.p>
          
          {/* Premium Loading Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="relative w-64 mx-auto"
          >
            <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-gold via-gold-light to-gold"
                initial={{ width: 0 }}
                animate={{ width: '100%' }}
                transition={{ duration: 2.5, delay: 2, ease: "easeInOut" }}
                style={{
                  boxShadow: '0 0 20px rgba(255, 215, 0, 0.8)',
                }}
              />
            </div>
            
            {/* Loading text */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 1, 1, 0] }}
              transition={{ duration: 2, delay: 2.5, repeat: Infinity }}
              className="text-sm text-gold-light/70 mt-2 font-light"
            >
              جاري التحميل...
            </motion.p>
          </motion.div>
          
          {/* Exit Animation Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5 }}
            exit={{ 
              opacity: 0, 
              y: -50,
              transition: { duration: 0.8, ease: "easeOut" }
            }}
          >
            <motion.p
              className="text-white/50 text-sm mt-8 tracking-wider"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              استعد للتميز
            </motion.p>
          </motion.div>
        </motion.div>
        
        {/* Corner Ornaments */}
        <motion.div 
          className="absolute top-8 left-8"
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-2 border-gold/30 rounded-full"
            style={{
              borderStyle: 'dashed',
            }}
          />
        </motion.div>
        
        <motion.div 
          className="absolute bottom-8 right-8"
          animate={{ opacity: isExiting ? 0 : 1 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-2 border-gold/30 rounded-full"
            style={{
              borderStyle: 'dashed',
            }}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
