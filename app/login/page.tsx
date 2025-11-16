'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Phone, Lock, LogIn,
  AlertCircle, Sparkles, Shield,
  ChevronRight, CreditCard, X,
  Crown, Diamond, Banknote
} from 'lucide-react'
import { useAuth } from '@/components/providers'
import toast from 'react-hot-toast'
import AnimatedEye from '@/components/AnimatedEye'

/* ---------------- Animated Background ---------------- */
const AnimatedBackground = () => {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-gold rounded-full"
          initial={{
            x: Math.random() * (typeof window !== 'undefined' ? window.innerWidth : 1920),
            y: Math.random() * (typeof window !== 'undefined' ? window.innerHeight : 1080)
          }}
          animate={{
            y: [-20, -100, -20],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 8 + Math.random() * 4,
            repeat: Infinity,
            repeatType: 'loop',
            delay: Math.random() * 5,
          }}
          style={{
            boxShadow: '0 0 4px rgba(255, 215, 0, 0.4)',
          }}
        />
      ))}
      <div className="absolute top-20 left-10 w-96 h-96 bg-gradient-radial from-gold/5 to-transparent rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-radial from-gold/3 to-transparent rounded-full blur-3xl animate-pulse animation-delay-2000" />
      <div className="absolute inset-0" style={{
        backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,215,0,0.03) 1px, transparent 1px)`,
        backgroundSize: '50px 50px'
      }}></div>
    </div>
  )
}

/* ---------------- Payment Modal ---------------- */
interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPackage?: {
    name: string;
    price: number;
  };
}

const PaymentModal = ({ isOpen, onClose, selectedPackage = { name: 'باقة الشهر الواحد', price: 200 } }: PaymentModalProps) => {
  if (!isOpen) return null;

  const handleSendPayment = () => {
    const message = encodeURIComponent(`مرحباً\nأرغب في الاشتراك في منصة التعليم\nالباقة: ${selectedPackage.name}\nالمبلغ: ${selectedPackage.price} جنيه\nتم تحويل المبلغ على رقم فودافون كاش: 01005209667`);
    if (typeof window !== 'undefined') {
      window.open(`https://wa.me/201005209667?text=${message}`, '_blank');
      toast.success('تم فتح WhatsApp، يرجى إرسال إيصال الدفع');
    }
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="luxury-card w-full max-w-lg rounded-3xl p-8 backdrop-blur-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-black gradient-text-animated">الدفع والتأكيد</h2>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-all">
              <X className="w-6 h-6" />
            </button>
          </div>
          <motion.div
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl p-6 bg-gradient-to-br from-gold/20 via-black to-black border-2 border-gold shadow-lg shadow-gold/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-gold/20 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-3xl"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold gradient-text-gold mb-1">إتمام الدفع</h3>
                  <p className="text-white/70 text-sm">الرجاء تحويل المبلغ للرقم التالي:</p>
                </div>
                <div className="p-2.5 bg-gradient-to-br from-gold/30 to-gold/5 rounded-xl border border-gold/40">
                  <Phone className="w-6 h-6 text-gold" />
                </div>
              </div>
              <div className="glass-morphism rounded-xl p-4 mb-6 border border-gold/30 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-gold/5 via-gold/10 to-gold/5 animate-pulse"></div>
                <p className="text-white/60 mb-1 text-sm">فودافون كاش</p>
                <p className="text-3xl font-bold text-gold font-mono tracking-wider relative z-10">01005209667</p>
              </div>
              <div className="bg-black/50 rounded-xl p-5 border border-gold/20 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white/60">الباقة:</span>
                  <span className="text-white font-bold">{selectedPackage.name}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/60">المبلغ المطلوب:</span>
                  <span className="text-2xl font-bold gradient-text-gold">{selectedPackage.price} جنيه</span>
                </div>
              </div>
              <button
                onClick={handleSendPayment}
                className="w-full py-3.5 rounded-xl bg-green-600 hover:bg-green-500 text-white font-bold flex items-center justify-center gap-3 transition-all active:scale-95 shadow-md"
              >
                <CreditCard className="w-6 h-6" />
                إرسال الإيصال للتأكيد
              </button>
              <p className="text-xs text-white/50 text-center mt-4">
                بعد التحويل، اضغط على الزر لإرسال إيصال الدفع عبر واتساب
              </p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

/* ---------------- Default Packages ---------------- */
const DEFAULT_PACKAGES = [
  { id: '1', name: 'باقة الشهر الواحد', price: 200, color: 'from-gold to-amber-600' },
  { id: '2', name: 'العرض المميز (خصم 50%)', price: 100, discountFrom: 200, color: 'from-green-500 to-emerald-700' },
  { id: '3', name: 'باقة الشهرين', price: 400, color: 'from-blue-500 to-indigo-700' },
  { id: '4', name: 'باقة 3 شهور', price: 550, color: 'from-purple-500 to-purple-800' },
  { id: '5', name: 'باقة 5 شهور', price: 900, color: 'from-red-500 to-rose-800' }
]

/* ---------------- Main Component ---------------- */
export default function ModernLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneParam = searchParams.get('phone') || '';
  const { signIn } = useAuth();

  const [formData, setFormData] = useState({ phoneNumber: phoneParam, password: '' });
  const [errors, setErrors] = useState({ phoneNumber: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPackageModal, setShowPackageModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [packages, setPackages] = useState(DEFAULT_PACKAGES);
  const [selectedPackage, setSelectedPackage] = useState(DEFAULT_PACKAGES[0]);
  const [packagesLoading, setPackagesLoading] = useState(true);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const response = await fetch('/api/packages');
        const data = await response.json();
        if (data.success && data.packages && data.packages.length > 0) {
          setPackages(data.packages);
        }
      } catch (error) {
        console.error('Failed to fetch packages:', error);
      } finally {
        setPackagesLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const validateForm = () => {
    const newErrors = { phoneNumber: '', password: '' };
    let isValid = true;
    const phoneRegex = /^01[0-2,5]{1}[0-9]{8}$/;
    if (
      formData.phoneNumber !== 'أحمد محرم' &&
      !phoneRegex.test(formData.phoneNumber)
    ) {
      newErrors.phoneNumber = 'رقم الهاتف غير صحيح';
      isValid = false;
    }
    if (
      formData.phoneNumber !== 'أحمد محرم' &&
      formData.password.length < 8
    ) {
      newErrors.password = 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
      isValid = false;
    }
    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // منع التكرار
    if (loading) {
      console.log('تم منع التكرار - المعالجة جارية');
      return;
    }
    
    if (!validateForm()) {
      toast.error('يرجى تصحيح الأخطاء أولاً');
      return;
    }
    
    setLoading(true);
    console.log('بدء معالجة تسجيل الدخول...');
    
    try {
      const result = await signIn(formData.phoneNumber, formData.password, true);
      console.log('نتيجة signIn:', result);
      
      if (result?.user) {
        // إذا كان المستخدم أدمن، اذهب مباشرة للوحة التحكم
        if (result.user.role === 'admin' || formData.phoneNumber === 'أحمد محرم') {
          console.log('المستخدم أدمن - توجيه للوحة التحكم');
          console.log('بيانات المستخدم:', result.user);
          
          // تعيين role إلى admin إذا لم يكن موجوداً
          if (!result.user.role) {
            result.user.role = 'admin';
          }
          
          // تأكد من حفظ البيانات في localStorage و cookies
          localStorage.setItem('isAdmin', 'true');
          localStorage.setItem('user', JSON.stringify(result.user));
          
          // حفظ في cookies مع المزيد من الخيارات - مسح أي cookies قديمة أولاً
          document.cookie = 'isAdmin=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
          document.cookie = 'isAdmin=; path=/admin; expires=Thu, 01 Jan 1970 00:00:00 UTC;';
          
          // إضافة cookies جديدة
          const cookieString = `isAdmin=true; path=/; max-age=${24 * 60 * 60}; SameSite=Lax`;
          document.cookie = cookieString;
          
          // إضافة cookie مخصص لمسار /admin
          const adminCookieString = `isAdmin=true; path=/admin; max-age=${24 * 60 * 60}; SameSite=Lax`;
          document.cookie = adminCookieString;
          
          console.log('تم حفظ Cookie للمسار الرئيسي:', cookieString);
          console.log('تم حفظ Cookie لمسار الأدمن:', adminCookieString);
          
          // التحقق من حفظ البيانات
          console.log('localStorage isAdmin:', localStorage.getItem('isAdmin'));
          console.log('جميع الـ cookies:', document.cookie);
          
          toast.success('مرحباً بك في لوحة التحكم!');
          
          // انتظار قصير قبل التوجيه للتأكد من حفظ البيانات
          setTimeout(() => {
            console.log('توجيه إلى /admin...');
            
            // إعادة تحميل كاملة
            window.location.href = '/admin';
          }, 1000); // زيادة الوقت إلى 1 ثانية للتأكد
          
          return;
        }
        
        const subResponse = await fetch('/api/check-subscription');
        if (subResponse.ok && result.success) {
          console.log('تم تسجيل الدخول بنجاح:', result);
          toast.success('تم تسجيل الدخول بنجاح!');
          
          // توجيه المستخدم إلى صفحة الاشتراكات إذا لم يكن لديه اشتراك نشط
          if (result.user && result.user.subscription_status !== 'active') {
            setTimeout(() => { window.location.href = '/subscription'; }, 200);
          } else {
            setTimeout(() => { window.location.href = '/dashboard'; }, 200);
          }
        } else {
          setShowPackageModal(true);
        }
      }
    } catch (error: any) {
      const errorMessage = error.message?.includes('Invalid login credentials')
        ? 'رقم الهاتف أو كلمة المرور غير صحيحة'
        : 'فشل تسجيل الدخول';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const showPackagePayment = (pkg: any) => {
    setSelectedPackage(pkg);
    setShowPackageModal(false);
    setTimeout(() => setShowPaymentModal(true), 100);
  };

  const showPackages = () => {
    setShowPackageModal(true);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden">
      <AnimatedBackground />
      <div className="relative z-10 w-full max-w-6xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }} className="hidden lg:block">
            <div className="relative">
              <h1 className="text-6xl font-black mb-6">
                <span className="gradient-text-animated">مرحباً بعودتك</span>
                <motion.span initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="block text-4xl mt-4 text-gray-400">
                  إلى منصتك التعليمية
                </motion.span>
              </h1>
              <p className="text-xl text-gray-300 mb-8">
                تعلم بذكاء، وحقق أحلامك مع أفضل المدرسين
              </p>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <div className="luxury-card rounded-3xl p-8 lg:p-12 backdrop-blur-xl">
              <div className="mb-8 text-center lg:text-right">
                <div className="inline-block p-4 rounded-2xl bg-gradient-to-br from-gold to-gold-dark shadow-2xl mb-4">
                  <LogIn className="w-8 h-8 text-black" />
                </div>
                <h2 className="text-3xl font-black gradient-text-animated mb-2">تسجيل الدخول</h2>
                <p className="text-white/60">سجل دخولك لمنصة أحمد محرم</p>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gold/80">رقم الهاتف</label>
                  <div className="relative">
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} className="w-full px-12 py-4 bg-black/50 border border-gold/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-all" placeholder="01012345678" dir="ltr" />
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                  </div>
                  {errors.phoneNumber && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.phoneNumber}</p>}
                </div>
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-medium text-gold/80">كلمة المرور</label>
                    <Link href="/forgot-password" className="text-xs gradient-text hover:text-gold">نسيت كلمة المرور؟</Link>
                  </div>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} className="w-full px-12 py-4 bg-black/50 border border-gold/20 rounded-lg text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-all" placeholder="••••••••" />
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gold/50" />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gold/50 hover:text-gold">
                      <AnimatedEye isOpen={showPassword} isWatching={formData.password.length > 0} />
                    </button>
                  </div>
                  {errors.password && <p className="text-red-400 text-sm mt-2 flex items-center gap-1"><AlertCircle className="w-4 h-4" />{errors.password}</p>}
                </div>
                <div className="space-y-4">
                  <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-3 text-lg">
                    {loading ? <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> جاري تسجيل الدخول...</> : <>تسجيل الدخول <ChevronRight className="w-5 h-5" /></>}
                  </button>
                  <button type="button" onClick={showPackages} className="bg-gradient-to-r from-gold/80 to-amber-600/80 text-black font-bold w-full py-3 rounded-xl hover:from-gold hover:to-amber-600 transition-all active:scale-95 flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5" /> الاشتراك في المنصة
                  </button>
                </div>
              </form>
              <p className="text-center text-white/50 mt-8">
                لا تمتلك حسابًا؟ <Link href="/register" className="gradient-text hover:text-gold transition">أنشئ حساب جديد</Link>
              </p>
            </div>
          </motion.div>
        </div>
      </div>
      <AnimatePresence>
        {showPackageModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="luxury-card w-full max-w-3xl rounded-3xl p-8 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-3xl font-black gradient-text-animated">اختر الباقة المناسبة</h2>
                <button onClick={() => setShowPackageModal(false)} className="p-2 rounded-xl hover:bg-white/10 transition-all"><X className="w-6 h-6" /></button>
              </div>
              {packagesLoading ? (
                <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {packages.map((pkg: any) => (
                    <motion.div key={pkg.id} whileHover={{ scale: 1.03 }} className={`p-6 rounded-2xl bg-gradient-to-br ${pkg.color} border border-gold/20 cursor-pointer`} onClick={() => showPackagePayment(pkg)}>
                      <h3 className="text-xl font-bold text-white mb-2">{pkg.name}</h3>
                      <p className="text-white/80 text-lg">{pkg.price} جنيه</p>
                      {pkg.discountFrom && <p className="text-sm text-red-300 line-through">{pkg.discountFrom} جنيه</p>}
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <PaymentModal isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} selectedPackage={selectedPackage} />
    </div>
  );
}               








