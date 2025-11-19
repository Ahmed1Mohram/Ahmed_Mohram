'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Edit, Trash2, X, CheckCircle, Image, ArrowUp, ArrowDown, Star } from 'lucide-react'
import { supabase } from '@/components/providers'
import toast from 'react-hot-toast'

interface Subject {
  id: string
  title: string
  description: string
  image_url: string
  color: string
  is_premium: boolean
  is_active: boolean
  order_index: number
}

export default function SubjectManager({ onManageLectures }: { onManageLectures: (subject: Subject) => void }) {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Subject | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    image_url: '',
    color: 'from-blue-500 to-purple-600',
    is_premium: false,
    is_active: true,
    order_index: 1,
  })

  useEffect(() => {
    fetchSubjects()
  }, [])

  const fetchSubjects = async () => {
    setLoading(true)
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
      let attempts = 0
      const maxRetries = 2
      let lastErr: any = null
      while (attempts <= maxRetries) {
        try {
          const res = await fetch(`${baseUrl}/api/admin/subjects`, { cache: 'no-store' })
          if (!res.ok) {
            try { const j = await res.json(); throw new Error(j?.error || 'failed') } catch { throw new Error('failed') }
          }
          const json = await res.json()
          setSubjects((json.subjects || []) as Subject[])
          lastErr = null
          break
        } catch (e: any) {
          lastErr = e
          attempts++
          if (attempts <= maxRetries) {
            await new Promise(r => setTimeout(r, 800))
            continue
          }
        }
      }
      if (lastErr) throw lastErr
    } catch (e) {
      toast.error('فشل جلب المواد')
    } finally {
      setLoading(false)
    }
  }

  const onSelectImage = async (file?: File | null) => {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'subject-thumbnails')

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.ok || !json.url) {
        throw new Error(json?.error || 'upload failed')
      }

      setForm(prev => ({ ...prev, image_url: json.url }))
      toast.success('تم رفع صورة المادة')
    } catch (e) {
      console.error('Subject image upload error:', e)
      toast.error('فشل رفع صورة المادة')
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', description: '', image_url: '', color: 'from-blue-500 to-purple-600', is_premium: false, is_active: true, order_index: (subjects[subjects.length-1]?.order_index || 0) + 1 })
    setShowForm(true)
  }

  const openEdit = (s: Subject) => {
    setEditing(s)
    setForm({
      title: s.title || '',
      description: s.description || '',
      image_url: s.image_url || '',
      color: s.color || 'from-blue-500 to-purple-600',
      is_premium: !!s.is_premium,
      is_active: !!s.is_active,
      order_index: s.order_index || 1,
    })
    setShowForm(true)
  }

  const save = async () => {
    try {
      if (!form.title) {
        toast.error('أدخل عنوان المادة')
        return
      }
      if (editing) {
        const res = await fetch('/api/admin/subjects', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, title: form.title, description: form.description, image_url: form.image_url, color: form.color, is_premium: form.is_premium, is_active: form.is_active, order_index: form.order_index })
        })
        if (!res.ok) throw new Error('update failed')
        toast.success('تم تحديث المادة')
      } else {
        const res = await fetch('/api/admin/subjects', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: form.title, description: form.description, image_url: form.image_url, color: form.color, is_premium: form.is_premium, is_active: form.is_active, order_index: form.order_index })
        })
        if (!res.ok) throw new Error('create failed')
        toast.success('تم إضافة مادة')
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'subject_created', data: { title: form.title } })
          })
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'subject_created',
              title: `تم إضافة مادة جديدة`,
              message: `تم إضافة مادة: ${form.title}`
            })
          })
        } catch {}
      }
      setShowForm(false)
      fetchSubjects()
    } catch (e) {
      toast.error('فشل الحفظ')
    }
  }

  const remove = async (s: Subject) => {
    if (!window.confirm(`حذف ${s.title}؟`)) return
    try {
      const res = await fetch(`/api/admin/subjects?id=${encodeURIComponent(s.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      toast.success('تم الحذف')
      fetchSubjects()
    } catch (e) {
      toast.error('فشل الحذف')
    }
  }

  const toggleActive = async (s: Subject) => {
    try {
      const res = await fetch('/api/admin/subjects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, is_active: !s.is_active }) })
      if (!res.ok) throw new Error('toggle failed')
      setSubjects(prev => prev.map(p => p.id === s.id ? { ...p, is_active: !s.is_active } : p))
    } catch {
      toast.error('فشل تغيير الحالة')
    }
  }

  const togglePremium = async (s: Subject) => {
    try {
      const res = await fetch('/api/admin/subjects', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, is_premium: !s.is_premium }) })
      if (!res.ok) throw new Error('toggle failed')
      setSubjects(prev => prev.map(p => p.id === s.id ? { ...p, is_premium: !s.is_premium } : p))
    } catch {
      toast.error('فشل تغيير المدفوعة')
    }
  }

  const move = async (s: Subject, direction: -1 | 1) => {
    try {
      const res = await fetch('/api/admin/subjects/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: s.id, direction }) })
      if (!res.ok) throw new Error('reorder failed')
      // locally reorder for snappy UI
      const sorted = [...subjects].sort((a, b) => a.order_index - b.order_index)
      const idx = sorted.findIndex(x => x.id === s.id)
      const targetIdx = idx + direction
      if (targetIdx < 0 || targetIdx >= sorted.length) return
      const other = sorted[targetIdx]
      setSubjects(prev => prev.map(x => x.id === s.id ? { ...x, order_index: other.order_index } : x)
        .map(x => x.id === other.id ? { ...x, order_index: s.order_index } : x))
    } catch {
      toast.error('فشل تغيير الترتيب')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 gap-3">
        <h2 className="text-2xl font-bold gradient-text">إدارة المواد الدراسية</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالعنوان أو الوصف"
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
          />
          <button onClick={openAdd} className="px-4 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-lg hover:shadow-gold-glow transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" />
            إضافة مادة جديدة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...subjects]
            .sort((a,b) => a.order_index - b.order_index)
            .filter(s => !query || s.title.toLowerCase().includes(query.toLowerCase()) || (s.description || '').toLowerCase().includes(query.toLowerCase()))
            .map((s) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luxury-card rounded-2xl p-6 border border-gold/20">
              <div className="flex items-center gap-4 mb-4">
                <div className={`w-16 h-16 bg-gradient-to-br ${s.color || 'from-blue-500 to-purple-600'} rounded-xl flex items-center justify-center overflow-hidden`}>
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                  ) : (
                    <BookOpen className="w-8 h-8 text-white" />
                  )}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{s.title}</h3>
                  <p className="text-white/60 text-sm line-clamp-2">{s.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs mb-3">
                <span className={`px-2 py-1 rounded-full ${s.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{s.is_active ? 'نشطة' : 'غير نشطة'}</span>
                <span className={`px-2 py-1 rounded-full ${s.is_premium ? 'bg-gold/20 text-gold' : 'bg-white/10 text-white/70'}`}>{s.is_premium ? 'مدفوعة' : 'مجانية'}</span>
                <span className="px-2 py-1 rounded-full bg-white/10 text-white/60">ترتيب: {s.order_index}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(s)} className="flex-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all flex items-center justify-center gap-1">
                  <Edit className="w-4 h-4" /> تعديل
                </button>
                <button onClick={() => onManageLectures(s)} className="flex-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all flex items-center justify-center gap-1">
                  <CheckCircle className="w-4 h-4" /> إدارة المحاضرات
                </button>
                <button onClick={() => remove(s)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all flex items-center justify-center">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleActive(s)} className="flex-1 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">تفعيل/تعطيل</button>
                <button onClick={() => togglePremium(s)} className={`flex-1 px-3 py-1 rounded-lg transition-all ${s.is_premium ? 'bg-gold/20 text-gold hover:bg-gold/30' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                  <span className="inline-flex items-center gap-1">مدفوعة {s.is_premium ? '✓' : ''}</span>
                </button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => move(s, -1)} className="flex-1 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-1"><ArrowUp className="w-4 h-4" /> أعلى</button>
                <button onClick={() => move(s, 1)} className="flex-1 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-1"><ArrowDown className="w-4 h-4" /> أسفل</button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="w-full max-w-2xl luxury-card rounded-3xl p-8 relative">
              <button onClick={() => setShowForm(false)} className="absolute top-4 left-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white">
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-2xl font-bold gradient-text mb-6">{editing ? 'تعديل مادة' : 'إضافة مادة'}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">العنوان</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="عنوان المادة" />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">الترتيب</label>
                  <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value || '0') })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-white/70 text-sm mb-2 block">الوصف</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="وصف المادة" />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">صورة</label>
                  <input
                    value={form.image_url}
                    onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white mb-2"
                    placeholder="https://... (اختياري، أو ارفع صورة)"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onSelectImage(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gold file:text-black hover:file:bg-yellow-500/90"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">الألوان</label>
                  <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="from-blue-500 to-purple-600" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input id="is_active" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5" />
                  <label htmlFor="is_active" className="text-white/80">نشطة</label>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input id="is_premium" type="checkbox" checked={form.is_premium} onChange={(e) => setForm({ ...form, is_premium: e.target.checked })} className="w-5 h-5" />
                  <label htmlFor="is_premium" className="text-white/80">مدفوعة</label>
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                <button onClick={save} className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold hover:shadow-lg transition-all">حفظ</button>
                <button onClick={() => setShowForm(false)} className="px-6 py-2 bg-white/10 text-white rounded-lg font-bold hover:bg-white/20 transition-all">إلغاء</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
