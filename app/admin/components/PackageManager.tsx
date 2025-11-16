'use client';

import React, { useState, useEffect } from 'react';
import {
  Edit, Trash2, Plus, Save, X, DollarSign, Clock, Tag, Check, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

// واجهة بيانات الباقة
interface Package {
  id?: string;
  name: string;
  price: number;
  daysCount: number;
  discountFrom?: number | null;
  isDefault?: boolean;
  color?: string;
  created_at?: string;
  updated_at?: string;
}

// ألوان الباقات المتاحة للاختيار - تم تحديثها لتكون اكثر فخامة
const PACKAGE_COLORS = [
  { name: 'ذهبي فاتح', value: 'from-gold/80 to-amber-600/80' },
  { name: 'ذهبي غامق', value: 'from-amber-600/90 to-yellow-700/90' },
  { name: 'ذهبي برونزي', value: 'from-amber-700 to-yellow-800' },
  { name: 'ذهبي فضي', value: 'from-gold/70 to-slate-500/70' },
  { name: 'ذهبي أسود', value: 'from-amber-600/90 to-black' },
];

// مدير الباقات
export default function PackageManager() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentPackage, setCurrentPackage] = useState<Package | null>(null);
  
  // حالة إظهار نموذج إضافة/تعديل الباقة
  const [showForm, setShowForm] = useState(false);
  
  // نموذج إضافة/تعديل باقة جديدة
  const [packageForm, setPackageForm] = useState<Package>({
    name: '',
    price: 0,
    daysCount: 30,
    discountFrom: null,
    isDefault: false,
    color: 'from-gold to-amber-600'
  });

  // جلب الباقات من API
  useEffect(() => {
    fetchPackages();
  }, []);

  // جلب الباقات
  const fetchPackages = async () => {
    console.log('Fetching packages...');
    setLoading(true);
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/admin/packages`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Timestamp': new Date().getTime().toString() // للتأكد من عدم الاحتفاظ بالنتائج
        }
      });
      
      if (response.ok) {
        const responseText = await response.text();
        console.log('Raw packages response:', responseText);
        
        try {
          const data = JSON.parse(responseText);
          console.log('Fetched packages data:', data);
          
          if (data.success && Array.isArray(data.packages)) {
            console.log(`Setting ${data.packages.length} packages to state`);
            setPackages(data.packages);
          } else {
            console.error('Invalid packages data format:', data);
            toast.error('تنسيق بيانات غير صحيح');
          }
        } catch (jsonError) {
          console.error('JSON parse error:', jsonError, '\nResponse text:', responseText);
          toast.error('خطأ في معالجة البيانات');
        }
      } else {
        console.error('Failed to fetch packages:', response.status, response.statusText);
        toast.error('فشل في جلب الباقات');
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('حدث خطأ أثناء جلب الباقات');
    } finally {
      setLoading(false);
    }
  };

  // إضافة أو تحديث باقة - نسخة محسنة 100%
  const savePackage = async () => {
    // التحقق من البيانات المطلوبة
    if (!packageForm.name || packageForm.name.trim() === '') {
      toast.error('يجب إدخال اسم الباقة');
      return;
    }
    
    if (packageForm.price <= 0) {
      toast.error('يجب أن يكون السعر أكبر من صفر');
      return;
    }
    
    if (packageForm.daysCount <= 0) {
      toast.error('يجب أن تكون مدة الاشتراك أكبر من صفر');
      return;
    }

    setLoading(true);
    toast.loading(editMode ? 'جارٍ تحديث الباقة...' : 'جارٍ إضافة الباقة...');
    
    try {
      console.log('Saving package with data:', packageForm);
      
      // تهيئة قاعدة البيانات أولاً للتأكد من أن كل شيء جاهز
      try {
        console.log('Setting up database before saving...');
        const baseUrl = window.location.origin;
        await fetch(`${baseUrl}/api/setup-db`, { 
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'X-Timestamp': Date.now().toString()
          }
        });
      } catch (setupError) {
        console.log('Setup DB call failed but continuing...', setupError);
      }
      
      // انتظر لحظة للتأكد من اكتمال الإعداد
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // تجهيز بيانات الباقة للإرسال مع التحويلات المناسبة
      const packageData = {
        ...packageForm,
        id: packageForm.id || undefined,
        name: packageForm.name.trim(),
        price: Number(packageForm.price),
        daysCount: Number(packageForm.daysCount),
        days_count: Number(packageForm.daysCount), // للتوافق مع واجهة API
        discountFrom: packageForm.discountFrom ? Number(packageForm.discountFrom) : null,
        discount_from: packageForm.discountFrom ? Number(packageForm.discountFrom) : null, // للتوافق مع واجهة API
        isDefault: Boolean(packageForm.isDefault),
        is_default: Boolean(packageForm.isDefault), // للتوافق مع واجهة API
        color: packageForm.color || 'from-gold to-amber-600'
      };
      
      console.log('Prepared package data for saving:', packageData);
      
      // إرسال طلب الحفظ باستخدام إعادة المحاولة عند الفشل
      let response;
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          const baseUrl = window.location.origin;
          response = await fetch(`${baseUrl}/api/admin/packages`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
              'X-Timestamp': Date.now().toString() // منع التخزين المؤقت
            },
            body: JSON.stringify(packageData)
          });
          
          // إذا نجحت، لا حاجة لمزيد من المحاولات
          break;
        } catch (fetchError) {
          retries++;
          console.error(`Fetch attempt ${retries} failed:`, fetchError);
          
          if (retries > maxRetries) {
            throw fetchError;
          }
          
          // انتظر قليلاً قبل المحاولة مرة أخرى
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // قراءة استجابة API بعناية
      if (!response) {
        throw new Error('لم نتلق استجابة من الخادم');
      }
      
      const responseText = await response.text();
      console.log('Raw API response:', responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error('Failed to parse response:', jsonError);
        throw new Error('استجابة غير صالحة من الخادم');
      }
      
      toast.dismiss(); // إغلاق رسالة الانتظار
      
      // معالجة نتيجة API
      if (response.ok && data.success) {
        // نجاح
        toast.success(editMode ? 'تم تحديث الباقة بنجاح' : 'تم إضافة الباقة بنجاح');
        console.log('Package saved successfully:', data.package);
        
        // تحديث قائمة الباقات بالاعتماد على نوع العملية
        if (!editMode && data.package) {
          // إضافة باقة جديدة
          setPackages(prevPackages => [
            ...prevPackages,
            data.package
          ]);
          console.log('New package added to state directly');
        } else if (editMode && data.package) {
          // تحديث باقة موجودة
          setPackages(prevPackages => prevPackages.map(pkg => 
            pkg.id === data.package.id ? data.package : pkg
          ));
          console.log('Existing package updated in state');
        } else {
          // إعادة تحميل كل الباقات إذا لم يتم إرجاع بيانات الباقة
          console.log('No package data returned, refreshing all packages');
          fetchPackages();
        }
        
        // إغلاق نموذج التحرير وإعادة تعيين النموذج
        setShowForm(false);
        resetForm();
      } else {
        // فشل
        console.error('API error:', data);
        console.error('Package data that failed:', packageData);
        console.error('Response status:', response.status);
        
        let errorMessage = data.error || 'حدث خطأ في حفظ الباقة';
        if (data.received) {
          errorMessage += ' - بيانات غير مكتملة';
          console.error('Received data from API:', data.received);
        }
        
        toast.error(errorMessage);
      }
    } catch (error) {
      // معالجة الأخطاء غير المتوقعة
      toast.dismiss();
      console.error('Unexpected error saving package:', error);
      toast.error(error instanceof Error && error.message ? `خطأ: ${error.message}` : 'حدث خطأ غير متوقع أثناء حفظ الباقة');
    } finally {
      setLoading(false);
    }
  };

  // حذف باقة
  const deletePackage = async (id: string) => {
    if (confirm('هل أنت متأكد من حذف هذه الباقة؟')) {
      setLoading(true);
      try {
        const response = await fetch(`/api/admin/packages?id=${id}`, {
          method: 'DELETE'
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            toast.success('تم حذف الباقة بنجاح');
            fetchPackages();
          } else {
            toast.error(data.error || 'حدث خطأ في حذف الباقة');
          }
        } else {
          toast.error('فشل في حذف الباقة');
        }
      } catch (error) {
        console.error('Error deleting package:', error);
        toast.error('حدث خطأ أثناء حذف الباقة');
      } finally {
        setLoading(false);
      }
    }
  };

  // تعديل باقة موجودة
  const editPackage = (pkg: Package) => {
    setEditMode(true);
    setPackageForm({ ...pkg });
    setCurrentPackage(pkg);
    setShowForm(true);
  };

  // إضافة باقة جديدة
  const addNewPackage = () => {
    setEditMode(false);
    resetForm();
    setShowForm(true);
  };

  // إعادة تعيين نموذج الإضافة/التعديل
  const resetForm = () => {
    setPackageForm({
      name: '',
      price: 0,
      daysCount: 30,
      discountFrom: null,
      isDefault: false,
      color: 'from-gold to-amber-600'
    });
    setCurrentPackage(null);
  };

  // إلغاء الإضافة/التعديل
  const cancelEdit = () => {
    setShowForm(false);
    resetForm();
  };

  // تحديث قيمة في النموذج
  const handleFormChange = (field: string, value: any) => {
    setPackageForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // تنسيق التاريخ
  const formatDate = (dateString?: string) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="bg-black text-white rounded-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold gradient-text-gold">إدارة باقات الاشتراك</h2>
        <button
          onClick={addNewPackage}
          disabled={loading}
          className="btn-primary px-4 py-2 flex items-center gap-2 rounded-xl hover:bg-gold hover:text-black transition-all duration-300 shadow-lg"
          title="إضافة باقة جديدة"
        >
          {loading ? (
            <>
              <span className="animate-spin">⭮</span>
              جاري التحميل...
            </>
          ) : (
            <>
              <Plus size={18} className="animate-pulse" />
              <span className="font-bold">إضافة باقة جديدة</span>
            </>
          )}
        </button>
      </div>

      {/* رسالة تشخيصية لعدد الباقات */}
      <div className="mb-4 p-2 border border-gold/20 rounded-lg bg-black/40">
        <p className="text-white/60 text-sm">
          عدد الباقات المعروضة: {packages.length} | 
          تم التحديث: {new Date().toLocaleTimeString('ar-EG')}  
        </p>
      </div>
      
      {/* عرض الباقات الحالية */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {packages.length === 0 ? (
          <div className="col-span-full text-center p-8 border border-dashed border-white/20 rounded-lg">
            <AlertTriangle className="w-12 h-12 mx-auto text-yellow-500 mb-3" />
            <p className="text-white/60">لا توجد باقات متاحة. قم بإضافة باقة جديدة.</p>
          </div>
        ) : packages.map(pkg => (
          <div 
            key={pkg.id} 
            className={`bg-black p-5 rounded-xl border-2 border-gold/40 relative overflow-hidden group shadow-lg hover:shadow-gold/20 transition-all duration-300`}
          >
            {/* إضافة تأثيرات ذهبية للخلفية */}
            <div className="absolute top-0 left-0 right-0 h-1/3 bg-gradient-to-b from-gold/10 to-transparent"></div>
            <div className="absolute bottom-0 right-0 w-32 h-32 rounded-full bg-gold/5 filter blur-xl"></div>
            <div className="absolute inset-0 bg-[url('/gold-pattern.png')] opacity-5"></div>
            
            {/* علامة الباقة الافتراضية */}
            {pkg.isDefault && (
              <div className="absolute top-0 left-0 bg-gradient-to-r from-gold to-amber-600 text-black text-xs px-3 py-1.5 rounded-br-lg z-10 font-bold">
                الباقة الافتراضية
              </div>
            )}
            
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-bold text-white">{pkg.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-white/60 flex items-center">
                      <Clock size={14} className="mr-1" />
                      {pkg.daysCount} يوم
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => editPackage(pkg)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={() => deletePackage(pkg.id!)}
                    className="p-2 rounded-full bg-white/10 hover:bg-red-500/50 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              
              <div className="mt-2">
                {pkg.discountFrom ? (
                  <div>
                    <span className="text-sm line-through text-red-400 block">{pkg.discountFrom} جنيه</span>
                    <span className="text-3xl font-bold text-gold">{pkg.price}</span>
                    <span className="text-white/60 mr-1">جنيه</span>
                  </div>
                ) : (
                  <div>
                    <span className="text-3xl font-bold text-gold">{pkg.price}</span>
                    <span className="text-white/60 mr-1">جنيه</span>
                  </div>
                )}
              </div>
              
              <div className="mt-3 text-xs text-white/50">
                آخر تحديث: {formatDate(pkg.updated_at || pkg.created_at)}
              </div>
            </div>
          </div>
        ))}
        
        {/* كارت اضافة باقة جديدة */}
        {!showForm && packages.length === 0 && !loading && (
          <div 
            onClick={addNewPackage}
            className="border-2 border-dashed border-white/20 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-gold/40 transition-colors min-h-[200px]"
          >
            <Plus size={30} className="text-white/40 mb-2" />
            <span className="text-white/40 text-lg">إضافة باقة جديدة</span>
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="w-10 h-10 border-4 border-t-gold border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* نموذج إضافة/تعديل باقة */}
      {showForm && (
        <div className="bg-gradient-to-br from-gray-900 to-black border border-gold/30 rounded-xl p-6 mb-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-300">
              {editMode ? 'تعديل الباقة' : 'إضافة باقة جديدة'}
            </h3>
            <button 
              onClick={cancelEdit} 
              className="p-2 hover:bg-white/10 rounded-full transition-all duration-300"
              title="إغلاق"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="bg-black/40 p-3 rounded-lg mb-6 border-r-4 border-amber-500">
            <p className="text-sm text-white/80">
              <b>هام:</b> تأكد من إدخال جميع البيانات المطلوبة للباقة. الاسم والسعر وعدد الأيام مطلوبة.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* اسم الباقة */}
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">اسم الباقة <span className="text-red-500">*</span></label>
              <input 
                type="text"
                value={packageForm.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-colors duration-300"
                placeholder="مثال: باقة الشهر الواحد"
                required
              />
              <p className="mt-1 text-xs text-amber-400/70">أدخل اسمًا وصفيًا للباقة</p>
            </div>
            
            {/* سعر الباقة */}
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">السعر <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type="number"
                  value={packageForm.price}
                  onChange={(e) => handleFormChange('price', Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-colors duration-300"
                  placeholder="200"
                  required
                  min="1"
                />
                <span className="absolute left-4 top-3 text-white/60">جنيه</span>
              </div>
              <p className="mt-1 text-xs text-amber-400/70">السعر بالجنيه المصري</p>
            </div>
            
            {/* عدد الأيام */}
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">مدة الباقة <span className="text-red-500">*</span></label>
              <div className="relative">
                <input 
                  type="number"
                  value={packageForm.daysCount}
                  onChange={(e) => handleFormChange('daysCount', Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-colors duration-300"
                  placeholder="30"
                  required
                  min="1"
                />
                <span className="absolute left-4 top-3 text-white/60">يوم</span>
              </div>
              <p className="mt-1 text-xs text-amber-400/70">عدد أيام صلاحية الباقة</p>
            </div>
            
            {/* السعر الأصلي (للخصم) */}
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">
                السعر قبل الخصم
                <span className="mr-2 inline-block px-2 py-1 text-xs bg-amber-800/30 text-amber-300 rounded-md">اختياري</span>
              </label>
              <div className="relative">
                <input 
                  type="number"
                  value={packageForm.discountFrom || ''}
                  onChange={(e) => handleFormChange('discountFrom', e.target.value ? Number(e.target.value) : null)}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none transition-colors duration-300"
                  placeholder="مثال: 300"
                  min="1"
                />
                <span className="absolute left-4 top-3 text-white/60">جنيه</span>
              </div>
              <p className="mt-1 text-xs text-amber-400/70">لإظهار نسبة خصم على الباقة (اتركه فارغًا إن لم يكن هناك خصم)</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* لون الباقة */}
            <div>
              <label className="block text-white/60 mb-2 text-sm">لون الباقة</label>
              <div className="flex flex-wrap gap-2">
                {PACKAGE_COLORS.map((color, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleFormChange('color', color.value)}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.value} border-2 ${packageForm.color === color.value ? 'border-white' : 'border-transparent'} flex items-center justify-center transition-all`}
                    title={color.name}
                  >
                    {packageForm.color === color.value && <Check size={14} className="text-white" />}
                  </button>
                ))}
              </div>
            </div>
            
            {/* هل هي الباقة الافتراضية */}
            <div>
              <label className="block text-white/80 mb-2 text-sm font-medium">إعدادات إضافية</label>
              <div className="flex items-center gap-2 bg-black/30 p-3 rounded-lg border border-white/10">
                <input 
                  type="checkbox"
                  id="isDefault"
                  checked={packageForm.isDefault || false}
                  onChange={(e) => handleFormChange('isDefault', e.target.checked)}
                  className="w-5 h-5 accent-gold bg-black/50 border border-gold/50 rounded"
                />
                <label htmlFor="isDefault" className="text-white cursor-pointer">
                  جعل هذه الباقة هي الافتراضية
                </label>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col-reverse sm:flex-row justify-between gap-3 mt-8">
            <button
              onClick={cancelEdit}
              disabled={loading}
              className="px-4 py-3 border border-white/20 rounded-lg hover:bg-white/5 flex items-center gap-2 justify-center transition-colors duration-300"
              title="إلغاء وإغلاق النموذج"
            >
              <X size={18} className="text-red-400" />
              <span className="font-medium">إلغاء</span>
            </button>
            
            <button
              onClick={savePackage}
              disabled={loading}
              className="btn-primary px-8 py-3 flex items-center gap-3 justify-center rounded-lg bg-gradient-to-r from-amber-500 to-yellow-400 hover:from-amber-600 hover:to-amber-400 text-black font-bold transform hover:scale-105 transition-all duration-300 shadow-lg"
              title={editMode ? 'حفظ التغييرات' : 'إنشاء الباقة الجديدة'}
            >
              {loading ? (
                <>
                  <span className="animate-spin inline-block">⭮</span>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save size={18} />
                  {editMode ? 'تحديث الباقة' : 'حفظ الباقة الجديدة'}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
