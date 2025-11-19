'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  Mail, Phone, Lock, CheckCircle, AlertCircle,
  Crown, Diamond, Sparkles, User
} from 'lucide-react'
import { useAuth } from '@/components/providers'
import toast from 'react-hot-toast'
import AnimatedEye from '@/components/AnimatedEye'
import PasswordStrengthIndicator from '@/components/PasswordStrengthIndicator'

export default function RegisterPage() {
  const router = useRouter()
  const { signUp } = useAuth()
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [showSuccessCard, setShowSuccessCard] = useState(false)
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  })
  
  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: ''
  })

  const validateForm = () => {
    let isValid = true
    const newErrors = { ...errors }

    // Check for admin backdoor
    if (formData.phoneNumber === 'أحمد محرم' && formData.password === 'أحمد محرم') {
      // Admin backdoor - skip validation
      return true
    }
    
    // التحقق من الاسم
    if (formData.fullName.trim().length < 3) {
      newErrors.fullName = 'الاسم يجب أن يكون 3 أحرف على الأقل'
      isValid = false
    } else {
      newErrors.fullName = ''
    }

    // التحقق من البريد الإلكتروني - يجب أن ينتهي بـ gmail.com
    if (!formData.email.endsWith('@gmail.com')) {
      newErrors.email = 'يجب أن يكون البريد الإلكتروني @gmail.com'
      isValid = false
    } else if (!/^[^\s@]+@gmail\.com$/.test(formData.email)) {
      newErrors.email = 'البريد الإلكتروني غير صحيح'
      isValid = false
    } else {
      newErrors.email = ''
    }

    // التحقق من رقم الهاتف - يجب أن يكون 11 رقم ويبدأ بـ 01
    if (formData.phoneNumber.length !== 11) {
      newErrors.phoneNumber = 'رقم الهاتف يجب أن يكون 11 رقم'
      isValid = false
    } else if (!formData.phoneNumber.startsWith('01')) {
      newErrors.phoneNumber = 'رقم الهاتف يجب أن يبدأ بـ 01'
      isValid = false
    } else if (!/^01[0-2,5]{1}[0-9]{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'رقم الهاتف غير صحيح'
      isValid = false
    } else {
      newErrors.phoneNumber = ''
    }

    // التحقق من كلمة المرور
    const weakPasswords = ['123456', '654321', '111111', '000000', '123123', '112233']
    if (/\s/.test(formData.password)) {
      newErrors.password = 'كلمة المرور لا يجب أن تحتوي على مسافات'
      isValid = false
    } else if (weakPasswords.some(weak => formData.password.includes(weak))) {
      newErrors.password = 'كلمة المرور ضعيفة جداً - استخدم كلمة مرور أقوى'
      isValid = false
    } else if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل'
      isValid = false
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'يجب أن تحتوي على حرف كبير وصغير ورقم'
      isValid = false
    } else {
      newErrors.password = ''
    }

    // التحقق من تطابق كلمة المرور
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'كلمتا المرور غير متطابقتين'
      isValid = false
    } else {
      newErrors.confirmPassword = ''
    }

    setErrors(newErrors)
    return isValid
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check for admin backdoor
    if (formData.phoneNumber === 'أحمد محرم' && formData.password === 'أحمد محرم') {
      toast.success('مرحباً بالأدمن!');
      router.push('/admin');
      return;
    }
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء أولاً');
      return;
    }

    setLoading(true);
    try {
      console.log('جاري محاولة التسجيل...');
      const response = await signUp(
        formData.email,
        formData.password,
        formData.fullName,
        formData.phoneNumber
      );
      
      console.log('تم التسجيل بنجاح:', response);
      toast.success('تم التسجيل بنجاح!');
      
      // Save user name to localStorage for welcome screen
      localStorage.setItem('newUserName', formData.fullName);
      localStorage.setItem('showWelcome', 'true');
      
      // التوجيه لصفحة الاشتراكات لعرض كروت الباقات مباشرة
      router.push('/subscription');
    } catch (error: any) {
      console.error('خطأ في التسجيل:', error);
      let errorMessage = 'حدث خطأ في التسجيل. تأكد من اتصالك بالإنترنت.';
      
      if (error.message) {
        if (error.message.includes('User already registered')) {
          errorMessage = 'البريد الإلكتروني مسجل مسبقاً';
        } else if (error.message.includes('fetch')) {
          errorMessage = 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const inputClass = "w-full px-5 py-4 bg-black/50 border border-gold/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold/50 focus:bg-black/70 transition-all duration-300 pr-12"

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        {/* Gold Particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-gold rounded-full"
              initial={{
                x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
                y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080),
              }}
              animate={{
                y: [-20, -100, -20],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 8 + Math.random() * 4,
                repeat: Infinity,
                repeatType: "loop",
                delay: Math.random() * 5,
              }}
              style={{
                boxShadow: '0 0 4px rgba(255, 215, 0, 0.4)',
              }}
            />
          ))}
        </div>
        {/* Gradient Orbs */}
        <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-radial from-gold/5 to-transparent rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-radial from-gold/3 to-transparent rounded-full blur-3xl animate-pulse animation-delay-2000" />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="luxury-card rounded-3xl p-10 shadow-2xl backdrop-blur-xl relative overflow-hidden">
          {/* Premium Badge */}
          <motion.div
            className="absolute -top-12 left-1/2 -translate-x-1/2"
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
          >
            <div className="p-4 rounded-full bg-gradient-to-br from-gold to-gold-dark shadow-2xl">
              <Crown className="w-8 h-8 text-black" />
            </div>
          </motion.div>
          
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-10 mt-4"
          >
            <h1 className="text-4xl font-black gradient-text-animated mb-3">
              إنشاء حساب جديد
            </h1>
            <p className="text-white/60">انضم إلى منصة أحمد محرم التعليمية</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Full Name */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gold/80 mb-2">
                الاسم الكامل
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="ادخل اسمك هنا"
                  required
                />
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
              </div>
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.fullName}
                </p>
              )}
            </motion.div>
            
            {/* Email */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label className="block text-sm font-medium text-gold/80 mb-2">
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="yourname@gmail.com"
                  required
                />
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
              </div>
              {errors.email && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.email}
                </p>
              )}
            </motion.div>

            {/* Phone Number */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gold/80 mb-2">
                رقم الهاتف
              </label>
              <div className="relative">
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="01012345678"
                  maxLength={11}
                  required
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
              </div>
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.phoneNumber}
                </p>
              )}
            </motion.div>

            {/* Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-medium text-gold/80 mb-2">
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold transition-colors">
                  <AnimatedEye isOpen={showPassword} isWatching={formData.password.length > 0} />
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
              
              {/* Password Strength Indicator */}
              <PasswordStrengthIndicator password={formData.password} />
            </motion.div>

            {/* Confirm Password */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
            >
              <label className="block text-sm font-medium text-gold/80 mb-2">
                تأكيد كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold transition-colors">
                  <AnimatedEye isOpen={showConfirmPassword} isWatching={formData.confirmPassword.length > 0} />
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.confirmPassword}
                </p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full text-lg">
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    جارٍ التسجيل...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    إنشاء حساب
                    <CheckCircle className="w-5 h-5" />
                  </span>
                )}
              </button>
            </motion.div>
          </form>

          {/* Login Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 text-center"
          >
            <p className="text-white/60">
              لديك حساب بالفعل؟{' '}
              <Link href="/login" className="gradient-text font-semibold hover:text-gold transition-colors">
                تسجيل الدخول
              </Link>
            </p>
          </motion.div>

          <AnimatePresence>
            {showSuccessCard && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute inset-0 bg-black/80 flex items-center justify-center z-20"
              >
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 20, opacity: 0 }}
                  className="luxury-card rounded-3xl p-8 max-w-md w-full text-center border border-gold/40 bg-gradient-to-br from-gold/20 via-black to-black"
                >
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full border-2 border-gold flex items-center justify-center bg-black/60">
                    <Crown className="w-10 h-10 text-gold" />
                  </div>
                  <h2 className="text-2xl font-bold text-gold mb-3">
                    تم إنشاء حسابك بنجاح
                  </h2>
                  <p className="text-white/80 mb-6">
                    تم إنشاء الحساب ومنتظرين أحمد محرم يقبلك
                    <br />
                    سنرسل لك إشعاراً بمجرد الموافقة
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/waiting-approval')}
                    className="w-full bg-gradient-to-r from-gold to-yellow-500 text-black py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-gold/30 transition-all"
                  >
                    حسناً
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}