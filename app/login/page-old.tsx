'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { 
  Phone, Lock, Eye, EyeOff, 
  LogIn, AlertCircle, X, Check
} from 'lucide-react'
import { useAuth } from '@/components/providers'
import toast from 'react-hot-toast'

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// مكون النافذة المنبثقة للدفع
const PaymentModal = ({ isOpen, onClose }: PaymentModalProps) => {
  if (!isOpen) return null;

  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('whatsapp');

  const handleSendPayment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // تحضير رسالة واتساب
    const message = encodeURIComponent(
      'مرحباً، أرغب في الاشتراك في منصة التعليم الذهبية. هذه بيانات الدفع الخاصة بي.'
    );
    
    // فتح واتساب مع الرسالة المحضرة
    // استخدام رقم الهاتف مباشرة لتجنب مشاكل متغيرات البيئة
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/201005209667?text=${message}`, '_blank');
    }
    
    toast.success('تم فتح WhatsApp، يرجى إرسال إيصال الدفع');
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gray-900 rounded-2xl p-6 w-full max-w-md border border-gray-800"
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gold-500">إتمام الاشتراك</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="mb-6">
          <div className="bg-gray-800/50 p-4 rounded-lg mb-4">
            <h3 className="font-bold text-white mb-2">الباقة الشهرية</h3>
            <p className="text-gold-500 text-2xl font-bold mb-1">299 جنيه / شهر</p>
            <p className="text-gray-400 text-sm">تشمل كافة المحاضرات والامتحانات</p>
            <div className="mt-3 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>وصول كامل للمحتوى</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>دعم مباشر من المدرسين</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <Check className="w-4 h-4 text-green-500" />
                <span>امتحانات تجريبية</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <p className="text-gray-300 mb-2">طرق الدفع المتاحة:</p>
              <div className="flex gap-2">
                <button
                  className={`flex-1 p-3 rounded-lg border ${
                    paymentMethod === 'whatsapp' 
                      ? 'border-gold-500 bg-gold-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  } transition-colors`}
                  onClick={() => setPaymentMethod('whatsapp')}
                >
                  <p className="text-sm font-medium text-center text-white">WhatsApp</p>
                </button>
                <button
                  className={`flex-1 p-3 rounded-lg border ${
                    paymentMethod === 'telegram' 
                      ? 'border-gold-500 bg-gold-500/10' 
                      : 'border-gray-700 hover:border-gray-600'
                  } transition-colors`}
                  onClick={() => setPaymentMethod('telegram')}
                >
                  <p className="text-sm font-medium text-center text-white">Telegram</p>
                </button>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                رقم الهاتف (اختياري)
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
                placeholder="01012345678"
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors"
              />
            </div>
            
            <div className="pt-4">
              <button
                onClick={handleSendPayment}
                className="w-full py-4 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold rounded-xl hover:scale-105 transition-transform"
              >
                <span className="flex items-center justify-center gap-2">
                  إرسال إثبات الدفع عبر واتساب
                  <LogIn className="w-5 h-5" />
                </span>
              </button>
              <p className="mt-3 text-xs text-center text-gray-400">
                بمجرد الدفع، سيتم تفعيل حسابك خلال 24 ساعة
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams?.get('phone') || '';
  
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  
  const [formData, setFormData] = useState({
    phoneNumber: phoneParam,
    password: '',
  });
  
  const [errors, setErrors] = useState({
    phoneNumber: '',
    password: '',
  });

  const validateForm = () => {
    let isValid = true;
    const newErrors = { ...errors };

    // التحقق من رقم الهاتف
    const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'رقم الهاتف غير صحيح (يجب أن يبدأ بـ 01)';
      isValid = false;
    } else {
      newErrors.phoneNumber = '';
    }

    // التحقق من كلمة المرور
    if (formData.password.length < 8) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
      isValid = false;
    } else {
      newErrors.password = '';
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء أولاً');
      return;
    }

    setLoading(true);
    try {
      console.log('جاري محاولة تسجيل الدخول برقم:', formData.phoneNumber);
      const result = await signIn(
        formData.phoneNumber,
        formData.password,
        true // إرسال علامة أن هذا رقم هاتف
      );
      
      const user = result?.user;
      console.log('تم تسجيل الدخول بنجاح:', user);
      
      if (user) {
        try {
          console.log('التحقق من حالة الاشتراك...');

          // محاولة التحقق من حالة الاشتراك باستخدام API
          try {
            const response = await fetch('/api/check-subscription');
            const result = await response.json();
            
            console.log('نتيجة التحقق من الاشتراك:', result);
            
            if (result.error) {
              console.warn('خطأ في التحقق من الاشتراك:', result.error);
              // مع ذلك نتابع إلى لوحة التحكم
              router.push('/dashboard');
              return;
            }
            
            if (result.active || result.subscription_status === 'active') {
              router.push('/dashboard');
            } else {
              // إظهار نافذة الدفع
              setShowPaymentModal(true);
            }
          } catch (apiError) {
            // في حالة فشل API التحقق من الاشتراك
            console.error('خطأ في API الاشتراك:', apiError);
            
            // الانتقال إلى لوحة التحكم على أي حال
            router.push('/dashboard');
          }
        } catch (generalError) {
          console.error('خطأ عام:', generalError);
          router.push('/dashboard');
        }
      }
    } catch (error: any) {
      console.error('خطأ تسجيل الدخول:', error);
      let errorMessage = 'فشل تسجيل الدخول. يرجى التحقق من بيانات الدخول.';
      
      if (error.message) {
        if (error.message.includes('Invalid login')) {
          errorMessage = 'رقم الهاتف أو كلمة المرور غير صحيحة';
        } else if (error.message.includes('fetch') || error.message.includes('network')) {
          errorMessage = 'تعذر الاتصال بالخادم. تحقق من اتصالك بالإنترنت.';
        } else if (error.message.includes('User not found')) {
          errorMessage = 'لم يتم العثور على المستخدم';
        }
      }
      
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const inputClass = "w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-gold-500 transition-colors pr-12";

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md"
      >
        <div className="bg-gray-900/80 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-gray-800">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-8"
          >
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent mb-2">
              تسجيل الدخول
            </h1>
            <p className="text-gray-400">أهلاً بعودتك! سجل دخول للوصول إلى حسابك</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Phone Number */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-medium text-gray-300 mb-2">
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
                  required
                />
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
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
              transition={{ delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-300">
                  كلمة المرور
                </label>
                <a href="#" className="text-xs text-gold-500 hover:text-gold-400">
                  نسيت كلمة المرور؟
                </a>
              </div>
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
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.password}
                </p>
              )}
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-gold-400 to-gold-600 text-black font-bold rounded-xl hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    جاري تسجيل الدخول...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    تسجيل الدخول
                    <LogIn className="w-5 h-5" />
                  </span>
                )}
              </button>
            </motion.div>
          </form>

          {/* Register Link */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 text-center"
          >
            <p className="text-gray-400">
              ليس لديك حساب بعد؟{' '}
              <Link href="/register" className="text-gold-500 hover:text-gold-400 font-medium">
                إنشاء حساب
              </Link>
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Payment Modal */}
      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
      />
    </div>
  );
}