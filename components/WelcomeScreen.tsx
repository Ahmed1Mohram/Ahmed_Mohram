'use client'

import React, { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Crown, Sparkles } from 'lucide-react'

interface WelcomeScreenProps {
  userName: string
  onComplete: () => void
}

export default function WelcomeScreen({ userName, onComplete }: WelcomeScreenProps) {
  useEffect(() => {
    // Play welcome sound
    const audio = new Audio('/منصه-enhanced-v2.wav')
    audio.volume = 0.3
    audio.play().catch(() => {
      console.log('Audio autoplay blocked')
    })
    
    // Auto-complete after animation
    const timer = setTimeout(() => {
      onComplete()
    }, 4500)
    
    return () => {
      clearTimeout(timer)
      audio.pause()
    }
  }, [onComplete])
  
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ 
          opacity: 0,
          filter: "blur(15px)",
          transition: { 
            duration: 1.5, 
            ease: [0.43, 0.13, 0.23, 0.96]
          }
        }}
        className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden"
      >
        {/* Animated Background */}
        <div className="absolute inset-0">
          {/* Gold particles */}
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gradient-to-r from-gold to-gold-light rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              animate={{
                y: [-20, -100, -20],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 5 + Math.random() * 5,
                repeat: Infinity,
                repeatType: "loop",
                delay: Math.random() * 3,
              }}
              style={{
                boxShadow: '0 0 8px rgba(255, 215, 0, 0.6)',
              }}
            />
          ))}
        </div>
        
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-radial from-black/50 via-black/70 to-black" />
        
        {/* Main Content */}
        <motion.div 
          className="relative text-center z-10"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
        >
          {/* Crown Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              delay: 0.3,
              duration: 0.8, 
              type: "spring",
              stiffness: 100
            }}
            className="mx-auto w-24 h-24 mb-8 relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-gold to-gold-dark rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative bg-gradient-to-br from-gold to-gold-dark rounded-full p-6">
              <Crown className="w-12 h-12 text-black" />
            </div>
          </motion.div>
          
          {/* Welcome Text */}
          <motion.h1
            className="text-5xl md:text-6xl font-black mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <span className="text-white">مرحباً بك يا</span>
          </motion.h1>
          
          {/* User Name */}
          <motion.h2
            className="text-6xl md:text-7xl font-black gradient-text-animated mb-8"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
          >
            {userName}
          </motion.h2>
          
          {/* Platform Name */}
          <motion.p
            className="text-2xl md:text-3xl text-white/80 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 }}
          >
            في منصة <span className="gradient-text font-bold">أحمد محرم</span> التعليمية
          </motion.p>
          
          {/* Loading Animation */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
            className="flex items-center justify-center gap-2"
          >
            {[...Array(3)].map((_, i) => (
              <motion.div
                key={i}
                className="w-3 h-3 bg-gold rounded-full"
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [1, 0.5, 1]
                }}
                transition={{
                  duration: 1,
                  repeat: Infinity,
                  delay: i * 0.2
                }}
              />
            ))}
          </motion.div>
          
          {/* Success Message */}
          <motion.p
            className="text-gold/60 text-lg mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{ 
              delay: 2,
              duration: 2,
              repeat: Infinity
            }}
          >
            جاري تجهيز منصتك...
          </motion.p>
          
          {/* Sparkles Animation */}
          <motion.div
            className="absolute -top-10 -left-10"
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-gold/30" />
          </motion.div>
          <motion.div
            className="absolute -bottom-10 -right-10"
            animate={{ rotate: -360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-8 h-8 text-gold/30" />
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
