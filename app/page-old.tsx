'use client'

import React from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  BookOpen, Users, Award, Play, Star, 
  CheckCircle, ArrowLeft, Zap, Target,
  TrendingUp, Shield, Clock, Globe
} from 'lucide-react'

export default function HomePage() {
  const fadeIn = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  }

  const features = [
    { icon: <BookOpen />, title: 'محتوى متميز', desc: 'محاضرات فيديو عالية الجودة' },
    { icon: <Users />, title: 'تواصل مباشر', desc: 'شات مباشر مع المدرسين' },
    { icon: <Award />, title: 'شهادات معتمدة', desc: 'احصل على شهادة بعد الإتمام' },
    { icon: <Shield />, title: 'آمن تماماً', desc: 'حماية كاملة لبياناتك' },
  ]

  const stats = [
    { number: '1000+', label: 'طالب نشط' },
    { number: '50+', label: 'مادة دراسية' },
    { number: '500+', label: 'محاضرة' },
    { number: '98%', label: 'نسبة النجاح' },
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center px-4 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8 }}
          className="text-center z-10 max-w-5xl mx-auto"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent"
            {...fadeIn}
          >
            منصة التعليم الذهبية
          </motion.h1>
          
          <motion.p 
            className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            ابدأ رحلتك التعليمية مع أفضل المدرسين والمحتوى التعليمي المتميز
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Link href="/register">
              <button className="group relative px-8 py-4 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold rounded-xl text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-gold-500/25">
                <span className="flex items-center gap-2">
                  ابدأ الآن مجاناً
                  <Zap className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                </span>
              </button>
            </Link>
            
            <Link href="/login">
              <button className="px-8 py-4 border-2 border-gold-500 text-gold-500 font-bold rounded-xl text-lg hover:bg-gold-500 hover:text-black transition-all duration-300">
                <span className="flex items-center gap-2">
                  تسجيل الدخول
                  <ArrowLeft className="w-5 h-5" />
                </span>
              </button>
            </Link>
          </motion.div>

          <motion.div
            className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              لا يتطلب بطاقة ائتمان
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              إلغاء في أي وقت
            </span>
            <span className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              دعم 24/7
            </span>
          </motion.div>
        </motion.div>

        {/* Animated Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-purple-500/20 rounded-full blur-xl animate-float" />
        <div className="absolute bottom-20 right-10 w-32 h-32 bg-gold-500/20 rounded-full blur-xl animate-float" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-blue-500/20 rounded-full blur-xl animate-float" style={{animationDelay: '4s'}} />
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gray-900/50">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                className="text-center"
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
              >
                <h3 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
                  {stat.number}
                </h3>
                <p className="text-gray-400 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="max-w-6xl mx-auto">
          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
              لماذا تختار منصتنا؟
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              نقدم لك تجربة تعليمية فريدة مع أحدث التقنيات وأفضل المدرسين
            </p>
          </motion.div>

          <motion.div 
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="relative group"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gold-400/20 to-gold-600/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative bg-gray-800/50 backdrop-blur-sm p-8 rounded-2xl border border-gray-700 group-hover:border-gold-500/50 transition-all duration-300">
                  <div className="text-gold-500 mb-4 transform group-hover:scale-110 transition-transform duration-300">
                    {React.cloneElement(feature.icon, { className: 'w-12 h-12 mx-auto' })}
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-white">{feature.title}</h3>
                  <p className="text-gray-400">{feature.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-gold-400/10 to-gold-600/10">
        <motion.div 
          className="max-w-4xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">
            ابدأ رحلتك التعليمية اليوم
          </h2>
          <p className="text-xl text-gray-300 mb-8">
            انضم إلى آلاف الطلاب الناجحين واحصل على أفضل تجربة تعليمية
          </p>
          <Link href="/register">
            <button className="group relative px-10 py-5 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold rounded-xl text-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-gold-500/25">
              <span className="flex items-center gap-3">
                سجل الآن واحصل على خصم 50%
                <Star className="w-6 h-6 group-hover:rotate-180 transition-transform duration-500" />
              </span>
            </button>
          </Link>
          
          <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-500">
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              متاح 24/7
            </span>
            <span className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              دعم باللغة العربية
            </span>
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              محتوى محدث باستمرار
            </span>
          </div>
        </motion.div>
      </section>
    </div>
  )
}