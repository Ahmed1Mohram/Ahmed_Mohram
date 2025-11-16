'use client'

import React, { useState, useEffect } from 'react'
import { useAudio } from '@/components/useAudio'
import AudioButton from '@/components/AudioButton'
import SoundToggle from '@/components/SoundToggle'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import SplashScreen from '@/components/SplashScreen'
import { 
  BookOpen, Users, Award, Play, Star, CheckCircle, 
  ArrowLeft, Zap, Target, TrendingUp, Shield, 
  Clock, Globe, Sparkles, Brain, Trophy, 
  Rocket, Heart, MessageCircle, ChevronDown, ChevronRight,
  Menu, X, Github, Twitter, Facebook, Instagram, Youtube,
  Crown, Gem, Diamond, ArrowUpRight, Check,
  GraduationCap, Lightbulb, BarChart3, Medal
} from 'lucide-react'

// Premium Navigation Component
const Navigation = ({ audioEnded = false, siteSettings }: { audioEnded?: boolean; siteSettings?: any }) => {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    // التأكد من وجود window (على جانب المتصفح فقط)
    if (typeof window !== 'undefined') {
      const handleScroll = () => {
        setScrolled(window.scrollY > 50)
      }
      window.addEventListener('scroll', handleScroll)
      return () => window.removeEventListener('scroll', handleScroll)
    }
    return undefined
  }, [])

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
      className={`fixed w-full top-0 z-50 transition-all duration-500 ${
        scrolled ? 'glass-morphism backdrop-blur-2xl py-3' : 'py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Premium Logo */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-4"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-gold via-gold-light to-gold blur-lg opacity-60 animate-pulse" />
              <div className="relative p-3 rounded-xl bg-black border border-gold/30">
                <Crown className="w-7 h-7 text-gold" strokeWidth={1.5} />
              </div>
            </div>
            <div>
              <span className="text-2xl font-bold gradient-text-animated block">{siteSettings?.hero_title?.split(' ').pop() || 'أحمد محرم'}</span>
              <span className="text-xs text-gold/70 tracking-widest uppercase">Premium Education</span>
            </div>
          </motion.div>
          
          {/* Luxury Navigation Links */}
          <div className="hidden lg:flex items-center gap-10">
            {[
              { label: 'الرئيسية', icon: null, href: '/' },
              { label: 'الدورات', icon: <Gem className="w-3 h-3" />, href: '#' },
              { label: 'المدرسين', icon: null, href: '#' },
              { label: 'الباقات المميزة', icon: <Diamond className="w-3 h-3" />, href: '/subscription' },
              { label: 'النتائج', icon: null, href: '#' },
            ].map((item, idx) => (
              <motion.a
                key={idx}
                href={item.href}
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ 
                  opacity: 1, 
                  y: 0, 
                  scale: 1,
                  backgroundColor: [
                    "rgba(255, 215, 0, 0)",
                    "rgba(255, 215, 0, 0.3)",
                    "rgba(255, 215, 0, 0.5)",
                    "rgba(255, 215, 0, 0.3)",
                    "rgba(255, 215, 0, 0)"
                  ],
                  boxShadow: [
                    "0 0 0px rgba(255, 215, 0, 0)",
                    "0 0 30px rgba(255, 215, 0, 1)",
                    "0 0 0px rgba(255, 215, 0, 0)"
                  ]
                }}
                transition={{ 
                  duration: 0.2, 
                  delay: 3.5 + idx * 0.67,
                  backgroundColor: {
                    duration: 0.5,
                    delay: 3.5 + idx * 0.67,
                    times: [0, 0.3, 0.5, 0.7, 1]
                  },
                  boxShadow: {
                    duration: 0.5,
                    delay: 3.5 + idx * 0.67
                  }
                }}
                whileHover={{ y: -2, textShadow: "0 0 8px rgba(255, 215, 0, 0.8)" }}
                className="relative text-white/80 hover:text-gold transition-all duration-300 text-sm font-medium tracking-wide flex items-center gap-1 px-2 py-1 rounded-lg"
              >
                {item.icon && <span className="text-gold">{item.icon}</span>}
                {item.label}
                <motion.span
                  className="absolute bottom-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-gold to-transparent"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.3 }}
                />
              </motion.a>
            ))}
          </div>
          
          {/* Premium CTAs */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 6.5 }}
            >
              <SoundToggle />
            </motion.div>
            <Link href="/login">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 6.8 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:block px-6 py-2.5 text-gold border border-gold/30 rounded-lg font-medium text-sm tracking-wide hover:bg-gold/10 transition-all duration-300"
              >
                تسجيل الدخول
              </motion.button>
            </Link>
            
            <Link href="/register">
              <motion.button
                initial={{ opacity: 0, x: 20 }}
                animate={audioEnded ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="hidden md:block btn-primary text-sm"
              >
                ابدأ التميز
              </motion.button>
            </Link>
            
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 rounded-lg glass-morphism border border-gold/20"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-gold" /> : <Menu className="w-5 h-5 text-gold" />}
            </button>
          </div>
        </div>
      </div>
      
      {/* Luxury Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="lg:hidden glass-morphism mt-4 mx-4 rounded-2xl p-6 border border-gold/20"
          >
            <div className="flex flex-col gap-6">
              {[
                { label: 'الرئيسية', href: '/' },
                { label: 'الدورات', href: '#' },
                { label: 'المدرسين', href: '#' },
                { label: 'الباقات المميزة', href: '/subscription' },
                { label: 'النتائج', href: '#' }
              ].map((item, idx) => (
                <a key={idx} href={item.href} className="text-white/80 hover:text-gold transition-colors font-medium">
                  {item.label}
                </a>
              ))}
              <div className="flex gap-4 mt-4 pt-4 border-t border-gold/20">
                <Link href="/login" className="flex-1">
                  <button className="w-full py-3 glass-morphism rounded-xl border border-gold/30 text-gold font-medium">تسجيل الدخول</button>
                </Link>
                <Link href="/register" className="flex-1">
                  <button className="w-full btn-primary text-sm">ابدأ التميز</button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  )
}

// Luxury Hero Section
const HeroSection = () => {
  return (
    <section className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Premium Background Effects */}
      <div className="absolute inset-0">
        {/* Gold Particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-px h-px bg-gold rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              animate={{
                y: [-20, -100, -20],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 8 + Math.random() * 7,
                repeat: Infinity,
                repeatType: "loop",
                delay: Math.random() * 10,
                ease: "easeInOut"
              }}
              style={{
                boxShadow: '0 0 6px rgba(255, 215, 0, 0.6)',
              }}
            />
          ))}
        </div>
        
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-radial from-gold/10 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-radial from-gold/5 to-transparent rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content Side */}
          <motion.div
            initial={{ opacity: 0, x: -80 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 2.5, ease: "easeOut" }}
          >
            {/* Premium Badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.0 }}
              className="inline-flex items-center gap-2 px-5 py-2.5 glass-morphism rounded-full mb-8 border border-gold/20"
            >
              <Crown className="w-4 h-4 text-gold" />
              <span className="text-sm font-medium text-gold tracking-wide">منصة التميز التعليمية</span>
              <Diamond className="w-3 h-3 text-gold animate-pulse" />
            </motion.div>
            
            {/* Main Heading */}
            <h1 className="text-5xl lg:text-7xl font-black mb-6 leading-tight">
              <motion.span 
                className="block gradient-text-animated"
                initial={{ opacity: 0, y: -100, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ 
                  duration: 0.8, 
                  type: "spring",
                  stiffness: 200,
                  damping: 15,
                  delay: 0.2 
                }}
              >
                مرحباً بك في
              </motion.span>
              <motion.span 
                className="block text-white mt-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ 
                  duration: 0.6,
                  type: "spring",
                  stiffness: 150,
                  delay: 1.0
                }}
              >
                منصة أحمد محرم
              </motion.span>
            </h1>
            
            {/* Description */}
            <motion.p 
              className="text-xl text-white/70 mb-10 leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 1.6 }}
            >
              منصة تعليمية رائدة تضم أكثر من <span className="text-gold font-bold">50,000</span> طالب 
              نقدم لك أفضل تجربة تعليمية بمعايير عالمية
            </motion.p>
            
            {/* CTAs */}
            <motion.div 
              className="flex flex-wrap gap-4 mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 4.0 }}
            >
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="btn-primary flex items-center gap-3"
                >
                  ابدأ رحلة التميز
                  <ArrowUpRight className="w-5 h-5" />
                </motion.button>
              </Link>
              
              <AudioButton />
            </motion.div>
            
            {/* Trust Indicators */}
            <motion.div 
              className="flex items-center gap-8 flex-wrap"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut", delay: 4.8 }}
            >
              {/* Students */}
              <div className="flex items-center gap-3">
                <div className="flex -space-x-3">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-gold to-gold-dark flex items-center justify-center border-2 border-black"
                    >
                      <span className="text-xs font-bold text-black">{i + 1}</span>
                    </div>
                  ))}
                </div>
                <div>
                  <p className="text-sm text-gold font-medium">+50K طالب</p>
                  <p className="text-xs text-white/50">يثقون بنا</p>
                </div>
              </div>
              
              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-gold fill-gold" />
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-white">4.98</p>
                  <p className="text-xs text-white/50">(15K+ تقييم)</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
          
          {/* Visual Side - Premium Stats Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="relative lg:block hidden"
          >
            <div className="relative">
              {/* Glow Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-gold/20 to-gold/10 rounded-3xl blur-3xl" />
              
              {/* Main Card */}
              <div className="relative luxury-card rounded-3xl p-8">
                <div className="grid grid-cols-2 gap-6">
                  {[
                    { icon: GraduationCap, label: 'دورة متميزة', count: '500+', color: 'from-gold to-gold-dark' },
                    { icon: Medal, label: 'شهادة معتمدة', count: '100%', color: 'from-white to-gray-200' },
                    { icon: Users, label: 'طالب نشط', count: '50K+', color: 'from-gold-light to-gold' },
                    { icon: Trophy, label: 'نسبة النجاح', count: '98%', color: 'from-gold to-gold-medium' }
                  ].map((item, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 60, scale: 0.7 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ 
                        delay: 2.0 + idx * 0.5,
                        duration: 0.8,
                        type: "spring",
                        stiffness: 120,
                        damping: 12
                      }}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="glass-morphism rounded-2xl p-6 text-center border border-gold/10 hover:border-gold/30 transition-all cursor-pointer group"
                    >
                      <div className={`inline-block p-3 rounded-xl bg-gradient-to-br ${item.color} mb-4 group-hover:scale-110 transition-transform`}>
                        <item.icon className="w-6 h-6 text-black" strokeWidth={1.5} />
                      </div>
                      <p className="text-3xl font-bold gradient-text mb-1">{item.count}</p>
                      <p className="text-sm text-white/60">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
                
                {/* Premium Badge */}
                <motion.div
                  className="absolute -top-4 -right-4 bg-gradient-to-r from-gold to-gold-dark rounded-full p-3"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Crown className="w-6 h-6 text-black" />
                </motion.div>
              </div>
            </div>
            
            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="absolute -top-8 left-8 glass-morphism rounded-2xl p-3 border border-gold/20"
            >
              <Sparkles className="w-6 h-6 text-gold" />
            </motion.div>
            
            <motion.div
              animate={{ y: [0, 15, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: 2 }}
              className="absolute -bottom-8 right-8 glass-morphism rounded-2xl p-3 border border-gold/20"
            >
              <Diamond className="w-6 h-6 text-gold" />
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Luxury Scroll Indicator */}
      <motion.div
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="absolute bottom-10 left-1/2 transform -translate-x-1/2"
      >
        <div className="flex flex-col items-center gap-2">
          <span className="text-xs text-gold/50 uppercase tracking-widest">استكشف</span>
          <ChevronDown className="w-6 h-6 text-gold/50" />
        </div>
      </motion.div>
    </section>
  )
}

// Luxury Features Section
const FeaturesSection = () => {
  const features = [
    {
      icon: Lightbulb,
      title: 'تعليم ذكي وتفاعلي',
      desc: 'تقنيات ذكاء اصطناعي تتكيف مع أسلوب تعلمك',
      number: '01'
    },
    {
      icon: Shield,
      title: 'حماية وأمان مطلق',
      desc: 'أعلى معايير الأمان والخصوصية لبياناتك',
      number: '02'
    },
    {
      icon: Medal,
      title: 'شهادات دولية معتمدة',
      desc: 'شهادات معترف بها دولياً تفتح لك أبواباً جديدة',
      number: '03'
    },
    {
      icon: Users,
      title: 'مجتمع نخبوي',
      desc: 'شبكة تواصل مع نخبة الطلاب والخبراء',
      number: '04'
    },
    {
      icon: Clock,
      title: 'تعلم بلا حدود',
      desc: 'وصول على مدار الساعة من أي مكان',
      number: '05'
    },
    {
      icon: BarChart3,
      title: 'تتبع تقدم فوري',
      desc: 'لوحة تحكم ذكية لمتابعة تقدمك وإنجازاتك',
      number: '06'
    }
  ]

  return (
    <section className="py-24 relative">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-gray-900/20 to-black pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <motion.span
            className="inline-block px-6 py-2 mb-6 text-xs tracking-[0.3em] uppercase text-gold border border-gold/30 rounded-full"
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            المميزات الحصرية
          </motion.span>
          
          <h2 className="text-5xl lg:text-6xl font-black mb-6">
            <span className="block gradient-text-animated">لماذا نحن الأفضل</span>
          </h2>
          <p className="text-xl text-white/60 max-w-3xl mx-auto leading-relaxed">
            نقدم لك تجربة تعليمية فريدة بمعايير عالمية وتقنيات متطورة
          </p>
        </motion.div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: idx * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -10, transition: { duration: 0.3 } }}
              className="group relative"
            >
              {/* Card */}
              <div className="relative luxury-card rounded-2xl p-8 h-full transition-all duration-500 hover:shadow-2xl hover:shadow-gold/10">
                {/* Number */}
                <span className="absolute top-8 right-8 text-6xl font-black text-gold/10 group-hover:text-gold/20 transition-colors">
                  {feature.number}
                </span>
                
                {/* Icon */}
                <motion.div
                  className="relative mb-6 inline-block"
                  whileHover={{ rotate: 360 }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="p-4 rounded-xl bg-gradient-to-br from-gold/20 to-gold/10 group-hover:from-gold/30 group-hover:to-gold/20 transition-all">
                    <feature.icon className="w-8 h-8 text-gold" strokeWidth={1.5} />
                  </div>
                </motion.div>
                
                {/* Content */}
                <h3 className="text-2xl font-bold mb-4 text-white group-hover:text-gold transition-colors">
                  {feature.title}
                </h3>
                <p className="text-white/60 leading-relaxed">
                  {feature.desc}
                </p>
                
                {/* Hover Effect Line */}
                <motion.div
                  className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold to-transparent"
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

// Stats Section
const StatsSection = () => {
  const stats = [
    { value: '10,000+', label: 'طالب سعيد', icon: Heart },
    { value: '500+', label: 'درس متاح', icon: BookOpen },
    { value: '50+', label: 'مدرس خبير', icon: Users },
    { value: '95%', label: 'نسبة النجاح', icon: TrendingUp }
  ]

  return (
    <section className="py-20 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-morphism rounded-3xl p-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="inline-block p-4 rounded-2xl glass-morphism mb-4">
                  <stat.icon className="w-8 h-8 text-purple-400" />
                </div>
                <h3 className="text-4xl font-bold gradient-text mb-2">{stat.value}</h3>
                <p className="text-gray-400">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

// CTA Section
const CTASection = () => {
  return (
    <section className="py-20 relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
          viewport={{ once: true, margin: "-100px" }}
          className="glass-morphism rounded-3xl p-12 text-center relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600"></div>
          
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600 rounded-full blur-3xl opacity-20"
          />
          
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.8, delay: 0.5, ease: "easeOut" }}
          >
            <Sparkles className="w-12 h-12 text-yellow-400 mx-auto mb-6" />
          </motion.div>
          
          <motion.h2 
            className="text-4xl lg:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 1.2, ease: "easeOut" }}
          >
            <span className="gradient-text">ابدأ رحلتك التعليمية</span>
            <br />
            <span className="text-white">اليوم!</span>
          </motion.h2>
          
          <motion.p 
            className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 1.8, ease: "easeOut" }}
          >
            انضم لآلاف الطلاب الناجحين واحصل على أفضل تجربة تعليمية
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 2, delay: 2.4, ease: "easeOut" }}
            className="flex flex-col md:flex-row items-center justify-center gap-4"
          >
            <Link href="/register">
              <motion.button
                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.95 }}
                className="btn-primary text-xl px-10 py-5 flex items-center gap-3"
              >
                سجل مجاناً الآن
                <ArrowLeft className="w-6 h-6" />
              </motion.button>
            </Link>
            
            <Link href="/subscription">
              <motion.button
                whileHover={{ scale: 1.05, transition: { duration: 0.3 } }}
                whileTap={{ scale: 0.95 }}
                className="glass-morphism border-2 border-gold/30 text-xl px-10 py-5 flex items-center gap-3 text-gold hover:bg-gold/10 transition-all"
              >
                اختر باقتك
                <Diamond className="w-6 h-6" />
              </motion.button>
            </Link>

            <motion.p 
              className="text-sm text-gray-400 mt-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
            >
              لا يتطلب بطاقة ائتمان • إلغاء في أي وقت
            </motion.p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

// Footer
const Footer = () => {
  return (
    <footer className="py-12 glass-morphism mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-purple-600 to-pink-600">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">EduPlatform</span>
          </div>
          
          <div className="flex gap-6">
            {[Github, Twitter, Facebook, Instagram].map((Icon, idx) => (
              <motion.a
                key={idx}
                href="#"
                whileHover={{ scale: 1.2, rotate: 360 }}
                transition={{ type: "spring", stiffness: 300 }}
                className="p-3 glass-morphism rounded-lg hover:bg-white/10"
              >
                <Icon className="w-5 h-5" />
              </motion.a>
            ))}
          </div>
          
          <p className="text-gray-400 text-sm">
            © 2024 EduPlatform. جميع الحقوق محفوظة.
          </p>
        </div>
      </div>
    </footer>
  )
}

export default function ModernHomePage() {
  const [showSplash, setShowSplash] = useState(true)
  const [audioEnded, setAudioEnded] = useState(false)
  const [siteSettings, setSiteSettings] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await fetch('/api/site-settings')
        const data = await response.json()
        if (data.success && data.settings) {
          setSiteSettings(data.settings)
        }
      } catch (error) {
        console.error('Error fetching site settings:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchSettings()
  }, [])

  useEffect(() => {
    if (!showSplash) {
      const timer = setTimeout(() => {
        setAudioEnded(true)
        console.log('تم تفعيل زر "ابدأ التميز"')
      }, 6000)
      return () => clearTimeout(timer)
    }
  }, [showSplash])
  
  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />
  }

  if (loading || !siteSettings) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/60">جاري التحميل...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-black text-white">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="w-full"
      >
        <Navigation audioEnded={audioEnded} siteSettings={siteSettings} />
        <HeroSection siteSettings={siteSettings} />
        <FeaturesSection />
        <StatsSection />
        <CTASection />
        <Footer />
      </motion.div>
    </div>
  )
}
