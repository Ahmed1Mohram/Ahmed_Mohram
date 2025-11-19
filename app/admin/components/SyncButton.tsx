'use client';

import { useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * زر مزامنة البيانات - يمكن إضافته إلى لوحة الأدمن لحل مشاكل عدم ظهور المحتوى
 */
export function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const handleSync = async () => {
    try {
      setLoading(true);
      toast.loading('جاري مزامنة المحتوى...', { id: 'sync' });
      
      const response = await fetch('/api/admin/content-sync', {
        headers: {
          'x-admin': 'true'
        }
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'فشلت عملية المزامنة');
      }
      
      setResults(data);
      toast.success('تمت المزامنة بنجاح!', { id: 'sync' });
      
      // إعادة تحميل الصفحة بعد 2 ثانية
      setTimeout(() => {
        window.location.reload();
      }, 2000);
      
    } catch (error: any) {
      console.error('خطأ في المزامنة:', error);
      toast.error(error.message || 'فشلت عملية المزامنة', { id: 'sync' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleSync}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gold text-black rounded-lg hover:bg-gold/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <RefreshCw className="w-5 h-5" />
        )}
        مزامنة المحتوى
      </button>
      
      {results && (
        <div className="mt-4 p-4 bg-gray-800/50 rounded-lg text-sm">
          <h3 className="text-gold font-bold mb-2">نتائج المزامنة</h3>
          
          {results.diagnostics?.length > 0 && (
            <div className="mb-2">
              <p className="font-bold text-yellow-400">التشخيص:</p>
              <ul className="list-disc list-inside">
                {results.diagnostics.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.stage}: تم العثور على {item.found} عنصر
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {results.fixes?.length > 0 && (
            <div className="mb-2">
              <p className="font-bold text-green-400">الإصلاحات:</p>
              <ul className="list-disc list-inside">
                {results.fixes.map((item: any, idx: number) => (
                  <li key={idx}>{item.message}</li>
                ))}
              </ul>
            </div>
          )}
          
          {results.errors?.length > 0 && (
            <div>
              <p className="font-bold text-red-400">الأخطاء:</p>
              <ul className="list-disc list-inside">
                {results.errors.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.stage}: {item.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
