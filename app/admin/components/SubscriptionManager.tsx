'use client';

import React, { useState, useEffect } from 'react';
import { 
  Edit, Trash2, Plus, Save, X, Clock, Calendar, User,
  CheckCircle, XCircle, MoreVertical, ArrowLeft, ArrowRight 
} from 'lucide-react';
import toast from 'react-hot-toast';

// واجهة بيانات الاشتراك
interface Subscription {
  id: string;
  user_id: string;
  package_id: string;
  package_name: string;
  status: 'pending' | 'active' | 'expired' | 'cancelled';
  price: number;
  days_count: number;
  start_date: string;
  expiry_date: string;
  days_left: number;
  is_active: boolean;
  payment_method?: string;
  transaction_id?: string;
  receipt_url?: string; // رابط إيصال الدفع
  users?: {
    id: string;
    full_name: string;
    phone_number: string;
    email?: string;
    status: string;
    payment_proof_url?: string;
  };
  created_at: string;
  updated_at?: string;
}

export default function SubscriptionManager() {
  // CSS للتلميحات عند تحويم المؤشر على الأزرار
  const tooltipStyles = `
    .tooltip-container {
      position: relative;
      display: inline-flex;
      justify-content: center;
      align-items: center;
    }
    .tooltip-text {
      visibility: hidden;
      position: absolute;
      z-index: 100;
      bottom: 125%;
      left: 50%;
      transform: translateX(-50%);
      background-color: rgba(0, 0, 0, 0.8);
      color: white;
      text-align: center;
      padding: 4px 8px;
      border-radius: 4px;
      white-space: nowrap;
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.3s;
    }
    .tooltip-container:hover .tooltip-text {
      visibility: visible;
      opacity: 1;
    }
  `;
  
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [daysChange, setDaysChange] = useState(0);
  const [quickDays, setQuickDays] = useState<{ [id: string]: number }>({});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchSubscriptions();
  }, [statusFilter]);

  // جلب الاشتراكات
  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      let url = '/api/admin/subscriptions';
      if (statusFilter !== 'all') {
        url += `?status=${statusFilter}`;
      }
      
      const response = await fetch(url);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.subscriptions) {
          setSubscriptions(data.subscriptions);
        }
      } else {
        toast.error('فشل في جلب الاشتراكات');
      }
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      toast.error('حدث خطأ أثناء جلب الاشتراكات');
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة الاشتراك والسماح بالدخول للمنصة
  const updateSubscriptionStatus = async (id: string, status: string) => {
    setLoading(true);
    try {
      // تحديث رسالة التأكيد للموافقة على الاشتراك
      const confirmMessage = status === 'active' 
        ? 'هل تريد الموافقة على هذا الاشتراك والسماح للمستخدم بالدخول إلى المنصة ومشاهدة المحاضرات؟'
        : 'هل تريد تأكيد إنهاء الاشتراك؟';
        
      const isConfirmed = window.confirm(confirmMessage);
      if (!isConfirmed) {
        setLoading(false);
        return;
      }
      
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id, 
          status,
          // إضافة علامة للسماح بالوصول إلى المنصة عند تفعيل الاشتراك
          allowPlatformAccess: status === 'active'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          // تحسين رسالة النجاح
          if (status === 'active') {
            toast.success('تم تفعيل الاشتراك والسماح للمستخدم بالدخول إلى المنصة ومشاهدة المحاضرات');
          } else {
            toast.success(`تم تحديث حالة الاشتراك إلى ${status === 'expired' ? 'منتهي' : 'ملغي'}`);
          }
          fetchSubscriptions();
        } else {
          toast.error(data.error || 'حدث خطأ في تحديث الاشتراك');
        }
      } else {
        toast.error('فشل في تحديث الاشتراك');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('حدث خطأ أثناء تحديث الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  // تحديث مدة الاشتراك (إضافة أو إنقاص أيام)
  const updateSubscriptionDays = async () => {
    if (!selectedSubscription || daysChange === 0) {
      toast.error('يرجى اختيار عدد الأيام');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedSubscription.id, 
          addDays: true, 
          daysChange: daysChange,
          status: selectedSubscription.status 
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`تم تعديل مدة الاشتراك ${daysChange > 0 ? 'بإضافة' : 'بإنقاص'} ${Math.abs(daysChange)} يوم`);
          setShowModal(false);
          setSelectedSubscription(null);
          setDaysChange(0);
          fetchSubscriptions();
        } else {
          toast.error(data.error || 'حدث خطأ في تعديل مدة الاشتراك');
        }
      } else {
        toast.error('فشل في تعديل مدة الاشتراك');
      }
    } catch (error) {
      console.error('Error updating subscription days:', error);
      toast.error('حدث خطأ أثناء تعديل مدة الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  // تعديل سريع لعدد الأيام من الجدول (+/-) بدون فتح النافذة
  const quickChangeSubscriptionDays = async (subscription: Subscription, delta: number) => {
    if (!delta) return;

    const confirmMsg = delta > 0
      ? `هل تريد إضافة ${Math.abs(delta)} يوم إلى مدة الاشتراك؟`
      : `هل تريد إنقاص ${Math.abs(delta)} يوم من مدة الاشتراك؟`;

    const confirmed = window.confirm(confirmMsg);
    if (!confirmed) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: subscription.id,
          addDays: true,
          daysChange: delta,
          status: subscription.status
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast.success(`تم ${delta > 0 ? 'إضافة' : 'إنقاص'} ${Math.abs(delta)} يوم للاشتراك`);
          fetchSubscriptions();
        } else {
          toast.error(data.error || 'حدث خطأ في تعديل مدة الاشتراك');
        }
      } else {
        toast.error('فشل في تعديل مدة الاشتراك');
      }
    } catch (error) {
      console.error('Error updating subscription days (quick):', error);
      toast.error('حدث خطأ أثناء تعديل مدة الاشتراك');
    } finally {
      setLoading(false);
    }
  };

  // تنسيق التاريخ
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // حساب مجموع الإيرادات
  const calculateTotalRevenue = () => {
    return subscriptions
      .filter(sub => sub.status === 'active')
      .reduce((sum, sub) => sum + (sub.price || 0), 0);
  };

  // عرض نافذة تعديل مدة الاشتراك
  const showEditDaysModal = (subscription: Subscription) => {
    setSelectedSubscription(subscription);
    setDaysChange(0);
    setShowModal(true);
  };

  // تصفية الاشتراكات حسب الحالة
  const filteredSubscriptions = subscriptions;
  
  // تقسيم الصفحات
  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = filteredSubscriptions.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
    <div className="bg-black text-white rounded-3xl p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold gradient-text-gold">إدارة اشتراكات المستخدمين</h2>
          <p className="text-white/60 text-sm mt-1">
            الإيرادات الكلية: <span className="text-gold font-bold">{calculateTotalRevenue()} ج.م</span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex rounded-lg overflow-hidden border border-white/20">
            <button 
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-2 text-sm ${statusFilter === 'all' ? 'bg-gold/20 text-white' : 'bg-black text-white/60 hover:bg-white/5'}`}
            >
              الكل
            </button>
            <button 
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-2 text-sm ${statusFilter === 'active' ? 'bg-gold/20 text-white' : 'bg-black text-white/60 hover:bg-white/5'}`}
            >
              نشط
            </button>
            <button 
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-2 text-sm ${statusFilter === 'pending' ? 'bg-gold/20 text-white' : 'bg-black text-white/60 hover:bg-white/5'}`}
            >
              معلق
            </button>
            <button 
              onClick={() => setStatusFilter('expired')}
              className={`px-3 py-2 text-sm ${statusFilter === 'expired' ? 'bg-gold/20 text-white' : 'bg-black text-white/60 hover:bg-white/5'}`}
            >
              منتهي
            </button>
          </div>
          
          <button
            onClick={fetchSubscriptions}
            className="p-2 rounded-lg border border-white/20 hover:bg-white/10 transition-colors"
            title="تحديث"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 2v6h-6"></path>
              <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
              <path d="M3 22v-6h6"></path>
              <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
            </svg>
          </button>
        </div>
      </div>

      {/* جدول الاشتراكات */}
      <div className="w-full overflow-x-auto mb-6">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-right py-3 px-4 text-white/70 font-medium text-sm">المستخدم</th>
              <th className="text-right py-3 px-4 text-white/70 font-medium text-sm">الباقة</th>
              <th className="text-right py-3 px-4 text-white/70 font-medium text-sm">المبلغ</th>
              <th className="text-right py-3 px-4 text-white/70 font-medium text-sm">تاريخ الانتهاء</th>
              <th className="text-right py-3 px-4 text-white/70 font-medium text-sm">الأيام المتبقية</th>
              <th className="text-right py-3 px-4 text-white/70 font-medium text-sm">الحالة</th>
              <th className="text-right py-3 px-4 text-white/70 font-medium text-sm">الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {paginatedSubscriptions.map(subscription => (
              <tr 
                key={subscription.id} 
                className="border-b border-white/5 hover:bg-white/5 transition-colors"
              >
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-black flex items-center justify-center text-gold font-bold">
                      {subscription.users?.full_name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <div className="font-medium">{subscription.users?.full_name || 'مستخدم غير معروف'}</div>
                      <div className="text-white/50 text-xs">{subscription.users?.phone_number || '--'}</div>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium">{subscription.package_name}</div>
                  <div className="text-white/50 text-xs">{subscription.days_count} يوم</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium text-gold">{subscription.price} ج.م</div>
                </td>
                <td className="py-3 px-4">
                  <div className="font-medium">{formatDate(subscription.expiry_date)}</div>
                  <div className="text-white/50 text-xs">تاريخ الانتهاء</div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex flex-col gap-1">
                    {subscription.days_left > 0 ? (
                      <div className="font-medium text-green-500">{subscription.days_left} يوم</div>
                    ) : (
                      <div className="font-medium text-red-500">منتهي</div>
                    )}
                    <div className="flex flex-wrap items-center gap-1 text-xs mt-1">
                      <input
                        type="number"
                        value={quickDays[subscription.id] ?? ''}
                        onChange={(e) => {
                          const value = Number(e.target.value);
                          setQuickDays((prev) => ({ ...prev, [subscription.id]: value }));
                        }}
                        className="w-20 px-2 py-1 rounded border border-white/20 bg-black/40 text-white text-xs"
                        placeholder="عدد الأيام"
                      />
                      <button
                        onClick={() => {
                          const value = quickDays[subscription.id] || 0;
                          if (!value) {
                            toast.error('يرجى إدخال عدد الأيام أولاً');
                            return;
                          }
                          quickChangeSubscriptionDays(subscription, value);
                        }}
                        className="px-2 py-0.5 rounded-full border border-green-500/60 text-green-400 hover:bg-green-500/10 disabled:opacity-50"
                        disabled={loading}
                      >
                        + الأيام
                      </button>
                      <button
                        onClick={() => {
                          const value = quickDays[subscription.id] || 0;
                          if (!value) {
                            toast.error('يرجى إدخال عدد الأيام أولاً');
                            return;
                          }
                          quickChangeSubscriptionDays(subscription, -value);
                        }}
                        className="px-2 py-0.5 rounded-full border border-red-500/60 text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                        disabled={loading}
                      >
                        - الأيام
                      </button>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  {subscription.status === 'active' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      نشط
                    </span>
                  ) : subscription.status === 'pending' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      معلق
                    </span>
                  ) : subscription.status === 'expired' ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      منتهي
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      ملغي
                    </span>
                  )}
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {/* أزرار الإجراءات المباشرة */}
                    <button 
                      onClick={() => showEditDaysModal(subscription)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white tooltip-container"
                      title="تعديل المدة"
                    >
                      <Clock size={16} />
                      <span className="tooltip-text">تعديل المدة</span>
                    </button>
                    
                    {/* عرض إيصال الدفع إذا وجد */}
                    {subscription.receipt_url && (
                      <a 
                        href={subscription.receipt_url} 
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-blue-500/20 text-blue-400 transition-colors tooltip-container"
                        title="عرض الإيصال"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                        <span className="tooltip-text">عرض الإيصال</span>
                      </a>
                    )}
                    
                    {/* زر تفعيل الاشتراك والسماح بالدخول للمنصة */}
                    {subscription.status !== 'active' && (
                      <button 
                        onClick={() => updateSubscriptionStatus(subscription.id, 'active')}
                        className="p-2 rounded-lg hover:bg-green-500/20 text-green-500 transition-colors tooltip-container"
                        title="الموافقة والتفعيل"
                      >
                        <CheckCircle size={16} />
                        <span className="tooltip-text">الموافقة والتفعيل</span>
                      </button>
                    )}
                    
                    {/* زر إنهاء الاشتراك (إلغاء الاشتراك الحالي وإرجاع المستخدم كأنه جديد بدون باقة) */}
                    {subscription.status !== 'cancelled' && (
                      <button 
                        onClick={() => updateSubscriptionStatus(subscription.id, 'cancelled')}
                        className="p-2 rounded-lg hover:bg-red-500/20 text-red-500 transition-colors tooltip-container"
                        title="إنهاء الاشتراك"
                      >
                        <XCircle size={16} />
                        <span className="tooltip-text">إنهاء الاشتراك</span>
                      </button>
                    )}
                    
                    {/* زر الموافقة على الاشتراك */}
                    {subscription.status === 'pending' && (
                      <button 
                        onClick={() => updateSubscriptionStatus(subscription.id, 'active')}
                        className="p-2 rounded-lg hover:bg-green-500/20 text-green-500 transition-colors tooltip-container"
                        title="الموافقة على الاشتراك"
                      >
                        <CheckCircle size={16} />
                        <span className="tooltip-text">الموافقة على الاشتراك</span>
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {/* No subscriptions message */}
            {paginatedSubscriptions.length === 0 && !loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center text-white/50">
                  لا توجد اشتراكات متاحة
                </td>
              </tr>
            )}
            
            {/* Loading indicator */}
            {loading && (
              <tr>
                <td colSpan={7} className="py-8 text-center">
                  <div className="inline-block w-6 h-6 border-2 border-gold border-t-transparent rounded-full animate-spin"></div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowRight size={16} />
          </button>
          
          <div className="text-white/60 text-sm">
            صفحة {currentPage} من {totalPages}
          </div>
          
          <button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowLeft size={16} />
          </button>
        </div>
      )}

      {/* Edit Days Modal */}
      {showModal && selectedSubscription && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-black border-2 border-gold/20 rounded-2xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gold">تعديل مدة الاشتراك</h3>
              <button 
                onClick={() => setShowModal(false)}
                className="p-2 rounded-full hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="mb-6">
              <div className="mb-4">
                <div className="text-white/60 mb-1 text-sm">المستخدم</div>
                <div className="font-bold">{selectedSubscription.users?.full_name}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-white/60 mb-1 text-sm">الباقة</div>
                <div className="font-bold">{selectedSubscription.package_name}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-white/60 mb-1 text-sm">تاريخ الانتهاء الحالي</div>
                <div className="font-bold">{formatDate(selectedSubscription.expiry_date)}</div>
              </div>
              
              <div className="mb-4">
                <div className="text-white/60 mb-1 text-sm">الأيام المتبقية</div>
                <div className="font-bold">{selectedSubscription.days_left} يوم</div>
              </div>
              
              <div className="mb-6">
                <label className="block text-white/60 mb-2 text-sm">تعديل عدد الأيام</label>
                <input 
                  type="number"
                  value={daysChange}
                  onChange={(e) => setDaysChange(Number(e.target.value))}
                  className="w-full bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white focus:border-gold/50 focus:outline-none"
                  placeholder="أدخل رقم موجب للإضافة، سالب للإنقاص"
                />
                <p className="text-white/60 text-xs mt-2">
                  أدخل رقم موجب لإضافة أيام، أو سالب لإنقاص أيام. مثال: 30 لإضافة شهر، -10 لإنقاص 10 أيام.
                </p>
              </div>
              
              <div className="flex justify-end gap-4">
                <button 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-white/20 rounded-lg hover:bg-white/10"
                >
                  إلغاء
                </button>
                <button 
                  onClick={updateSubscriptionDays}
                  disabled={loading || daysChange === 0}
                  className="px-4 py-2 bg-gold text-black font-bold rounded-lg hover:bg-gold/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading ? (
                    <span className="w-4 h-4 border-2 border-black/30 border-t-black/80 rounded-full animate-spin inline-block"></span>
                  ) : (
                    <Save size={16} />
                  )}
                  تحديث المدة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
