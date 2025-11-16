'use client';

import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function DebuggingPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [selectedAction, setSelectedAction] = useState('setup-db');

  const handleAction = async (action: string) => {
    setLoading(true);
    setResult(null);
    
    try {
      let response;
      
      if (action === 'setup-db') {
        response = await fetch('/api/setup-db');
      } else if (action === 'packages') {
        response = await fetch('/api/packages');
      } else if (action === 'test-save-package') {
        response = await fetch('/api/save-package-selection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'test-user-id',
            packageId: 'test-package-id',
            packageName: 'باقة اختبار',
            price: 100
          })
        });
      }
      
      if (!response) {
        throw new Error('No response');
      }
      
      const data = await response.json();
      setResult(data);
      
      if (data.success) {
        toast.success('تمت العملية بنجاح');
      } else {
        toast.error(data.error || 'حدث خطأ');
      }
    } catch (error) {
      console.error(`Error with ${action}:`, error);
      toast.error(`حدث خطأ أثناء ${action === 'setup-db' ? 'تهيئة قاعدة البيانات' : 'جلب البيانات'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-3xl font-bold mb-8 text-center">صفحة تصحيح الأخطاء</h1>
      
      <div className="max-w-lg mx-auto bg-gray-800 rounded-lg p-6 shadow-lg">
        <div className="mb-6">
          <label className="block mb-2">اختر العملية:</label>
          <select 
            className="w-full p-2 bg-gray-700 text-white rounded"
            value={selectedAction}
            onChange={(e) => setSelectedAction(e.target.value)}
          >
            <option value="setup-db">تهيئة قاعدة البيانات</option>
            <option value="packages">جلب الباقات</option>
            <option value="test-save-package">اختبار حفظ باقة</option>
          </select>
        </div>
        
        <button 
          onClick={() => handleAction(selectedAction)}
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50"
        >
          {loading ? 'جاري التنفيذ...' : 'تنفيذ العملية'}
        </button>
        
        {result && (
          <div className="mt-6">
            <h3 className="text-xl mb-2 font-semibold">النتيجة:</h3>
            <pre className="bg-gray-900 p-4 rounded overflow-auto max-h-96 text-sm whitespace-pre-wrap">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
