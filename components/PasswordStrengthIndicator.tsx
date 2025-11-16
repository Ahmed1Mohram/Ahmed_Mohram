'use client'

import React from 'react'
import { motion } from 'framer-motion'
import { Shield, ShieldAlert, ShieldCheck, ShieldX } from 'lucide-react'

interface PasswordStrengthIndicatorProps {
  password: string
}

export default function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  const calculateStrength = (pass: string): { score: number; message: string; color: string } => {
    if (pass.length === 0) {
      return { score: 0, message: '', color: '' }
    }
    
    let score = 0
    const messages = []
    
    // Check for weak patterns
    const weakPatterns = ['123456', '654321', '111111', '000000', 'password', 'qwerty', 'abcdef']
    if (weakPatterns.some(pattern => pass.includes(pattern))) {
      return { score: 1, message: 'ضعيف جداً - كلمة مرور شائعة', color: 'text-red-500' }
    }
    
    // Length check
    if (pass.length >= 8) {
      score += 1
      messages.push('8 أحرف')
    }
    if (pass.length >= 12) {
      score += 1
      messages.push('طول جيد')
    }
    
    // Contains lowercase
    if (/[a-z]/.test(pass)) {
      score += 1
      messages.push('أحرف صغيرة')
    }
    
    // Contains uppercase
    if (/[A-Z]/.test(pass)) {
      score += 1
      messages.push('أحرف كبيرة')
    }
    
    // Contains numbers
    if (/\d/.test(pass)) {
      score += 1
      messages.push('أرقام')
    }
    
    // Contains special characters
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
      score += 1
      messages.push('رموز خاصة')
    }
    
    // No spaces
    if (/\s/.test(pass)) {
      return { score: 1, message: 'غير صالح - يحتوي على مسافات', color: 'text-red-500' }
    }
    
    // Determine strength level
    if (score <= 2) {
      return { score: 1, message: 'ضعيف', color: 'text-red-500' }
    } else if (score <= 4) {
      return { score: 2, message: 'متوسط', color: 'text-yellow-500' }
    } else if (score <= 5) {
      return { score: 3, message: 'جيد', color: 'text-blue-500' }
    } else {
      return { score: 4, message: 'قوي جداً', color: 'text-green-500' }
    }
  }
  
  const strength = calculateStrength(password)
  
  if (password.length === 0) return null
  
  const getIcon = () => {
    switch (strength.score) {
      case 1:
        return <ShieldX className="w-4 h-4" />
      case 2:
        return <ShieldAlert className="w-4 h-4" />
      case 3:
        return <Shield className="w-4 h-4" />
      case 4:
        return <ShieldCheck className="w-4 h-4" />
      default:
        return <Shield className="w-4 h-4" />
    }
  }
  
  return (
    <div className="mt-2 space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <motion.div
            key={level}
            className="flex-1 h-1 rounded-full bg-gray-700"
            initial={{ scaleX: 0 }}
            animate={{ 
              scaleX: 1,
              backgroundColor: level <= strength.score ? 
                (strength.score === 1 ? '#ef4444' : 
                 strength.score === 2 ? '#eab308' :
                 strength.score === 3 ? '#3b82f6' : '#22c55e') : '#374151'
            }}
            transition={{ duration: 0.3, delay: level * 0.05 }}
          />
        ))}
      </div>
      
      {/* Strength message */}
      <motion.div
        initial={{ opacity: 0, y: -5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 text-sm ${strength.color}`}
      >
        {getIcon()}
        <span className="font-medium">{strength.message}</span>
      </motion.div>
    </div>
  )
}
