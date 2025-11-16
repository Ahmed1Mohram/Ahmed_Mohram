'use client'

import { motion } from 'framer-motion'

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col items-center justify-center">
      <div className="relative w-40 h-40">
        {/* حلقات متحركة */}
        {[1, 2, 3, 4].map((index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ 
              opacity: [0, 1, 0.8, 0],
              scale: [0, 1, 1.3, 1.8],
              rotate: [0, 45, 90, 180]
            }}
            transition={{ 
              duration: 3.5, 
              ease: "easeInOut",
              repeat: Infinity,
              repeatDelay: 0.2,
              delay: index * 0.4,
              times: [0, 0.3, 0.6, 1] 
            }}
            className="absolute inset-0 border-2 border-gold rounded-full"
          />
        ))}
        
        {/* الشعار المتحرك */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut", delay: 1 }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className="w-24 h-24 bg-gradient-to-br from-gold to-yellow-600 rounded-2xl shadow-xl shadow-gold/30 flex items-center justify-center">
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 2, delay: 1.5 }}
              className="text-4xl font-bold text-black"
            >
              أ.م
            </motion.span>
          </div>
        </motion.div>
      </div>
      
      {/* رسالة التحميل */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 2, delay: 1.5 }}
        className="mt-8 text-center"
      >
        <h2 className="text-2xl font-bold gradient-text-animated mb-2">منصة أحمد محرم التعليمية</h2>
        <div className="flex items-center justify-center mt-4 gap-2">
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
            className="w-2 h-2 bg-gold rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.4, repeatDelay: 0.3 }}
            className="w-2 h-2 bg-gold rounded-full"
          />
          <motion.div 
            animate={{ scale: [1, 1.5, 1] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: 0.8, repeatDelay: 0.3 }}
            className="w-2 h-2 bg-gold rounded-full"
          />
        </div>
        <p className="text-white/60 mt-4">جاري تحميل المنصة، برجاء الانتظار...</p>
      </motion.div>
    </div>
  )
}
