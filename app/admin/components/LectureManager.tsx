'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Edit, Trash2, X, Camera, CheckCircle, ArrowUp, ArrowDown } from 'lucide-react'
import toast from 'react-hot-toast'

interface Subject { id: string; title: string }
interface Lecture {
  id: string
  title: string
  description: string
  duration_minutes: number
  is_free: boolean
  is_active: boolean
  thumbnail_url?: string
  order_index: number
}

export default function LectureManager({ subject, onBack, onManageContent }: { subject: Subject; onBack: () => void; onManageContent: (lecture: Lecture) => void }) {
  const [lectures, setLectures] = useState<Lecture[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Lecture | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({
    title: '',
    description: '',
    duration_minutes: 45,
    is_free: false,
    is_active: true,
    thumbnail_url: '',
    order_index: 1,
  })

  useEffect(() => { fetchLectures() }, [subject?.id])

  const fetchLectures = async () => {
    if (!subject?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/lectures?subjectId=${encodeURIComponent(subject.id)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'failed')
      setLectures((json.lectures || []) as Lecture[])
    } catch (e) {
      toast.error('فشل جلب المحاضرات')
    } finally {
      setLoading(false)
    }
  }

  const onSelectThumbnail = async (file?: File | null) => {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'lecture-thumbnails')

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.ok || !json.url) {
        throw new Error(json?.error || 'upload failed')
      }

      setForm(prev => ({ ...prev, thumbnail_url: json.url }))
      toast.success('تم رفع صورة المحاضرة')
    } catch (e) {
      console.error('Lecture thumbnail upload error:', e)
      toast.error('فشل رفع صورة المحاضرة')
    }
  }

  const toggleActive = async (l: Lecture) => {
    try {
      const res = await fetch('/api/admin/lectures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, is_active: !l.is_active }) })
      if (!res.ok) throw new Error('toggle failed')
      setLectures(prev => prev.map(p => p.id === l.id ? { ...p, is_active: !l.is_active } : p))
    } catch {
      toast.error('فشل تغيير الحالة')
    }
  }

  const toggleFree = async (l: Lecture) => {
    try {
      const res = await fetch('/api/admin/lectures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, is_free: !l.is_free }) })
      if (!res.ok) throw new Error('toggle failed')
      setLectures(prev => prev.map(p => p.id === l.id ? { ...p, is_free: !l.is_free } : p))
    } catch {
      toast.error('فشل تغيير المجانية')
    }
  }

  const move = async (l: Lecture, direction: -1 | 1) => {
    try {
      const res = await fetch('/api/admin/lectures/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, subject_id: subject.id, direction }) })
      if (!res.ok) throw new Error('reorder failed')
      const sorted = [...lectures].sort((a, b) => a.order_index - b.order_index)
      const idx = sorted.findIndex(x => x.id === l.id)
      const targetIdx = idx + direction
      if (targetIdx < 0 || targetIdx >= sorted.length) return
      const other = sorted[targetIdx]
      setLectures(prev => prev.map(x => x.id === l.id ? { ...x, order_index: other.order_index } : x)
        .map(x => x.id === other.id ? { ...x, order_index: l.order_index } : x))
    } catch {
      toast.error('فشل تغيير الترتيب')
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({ title: '', description: '', duration_minutes: 45, is_free: false, is_active: true, thumbnail_url: '', order_index: (lectures[lectures.length-1]?.order_index || 0) + 1 })
    setShowForm(true)
  }

  const openEdit = (l: Lecture) => {
    setEditing(l)
    setForm({
      title: l.title || '',
      description: l.description || '',
      duration_minutes: l.duration_minutes || 45,
      is_free: !!l.is_free,
      is_active: !!l.is_active,
      thumbnail_url: l.thumbnail_url || '',
      order_index: l.order_index || 1,
    })
    setShowForm(true)
  }

  const save = async () => {
    try {
      if (!form.title) { toast.error('أدخل عنوان المحاضرة'); return }
      if (editing) {
        const res = await fetch('/api/admin/lectures', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, title: form.title, description: form.description, duration_minutes: form.duration_minutes, is_free: form.is_free, is_active: form.is_active, thumbnail_url: form.thumbnail_url || null, order_index: form.order_index })
        })
        if (!res.ok) throw new Error('update failed')
        toast.success('تم تحديث المحاضرة')
      } else {
        const res = await fetch('/api/admin/lectures', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subject_id: subject.id, title: form.title, description: form.description, duration_minutes: form.duration_minutes, is_free: form.is_free, is_active: form.is_active, thumbnail_url: form.thumbnail_url || null, order_index: form.order_index })
        })
        if (!res.ok) throw new Error('create failed')
        toast.success('تم إضافة محاضرة')
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'lecture_created', data: { title: form.title, subject: subject.title } })
          })
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'lecture_created',
              title: `محاضرة جديدة في مادة ${subject.title}`,
              message: `تم إضافة المحاضرة: ${form.title}`
            })
          })
        } catch {}
      }
      setShowForm(false)
      fetchLectures()
    } catch (e) {
      toast.error('فشل الحفظ')
    }
  }

  const remove = async (l: Lecture) => {
    if (!window.confirm(`حذف ${l.title}؟`)) return
    try {
      const res = await fetch(`/api/admin/lectures?id=${encodeURIComponent(l.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      toast.success('تم الحذف')
      fetchLectures()
    } catch (e) {
      toast.error('فشل الحذف')
    }
  }

  const setThumb = async (l: Lecture) => {
    const url = window.prompt('ضع رابط الصورة')
    if (!url) return
    try {
      const res = await fetch('/api/admin/lectures', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: l.id, thumbnail_url: url }) })
      if (!res.ok) throw new Error('update failed')
      toast.success('تم تحديث الصورة')
      fetchLectures()
    } catch (e) {
      toast.error('فشل التحديث')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 gap-3">
        <button onClick={onBack} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">عودة للمواد</button>
        <h2 className="text-2xl font-bold gradient-text">محاضرات: {subject?.title}</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بعنوان/وصف"
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
          />
          <button onClick={openAdd} className="px-4 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-lg hover:shadow-gold-glow transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة محاضرة
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8"><div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...lectures]
            .sort((a,b) => a.order_index - b.order_index)
            .filter(l => !query || l.title.toLowerCase().includes(query.toLowerCase()) || (l.description || '').toLowerCase().includes(query.toLowerCase()))
            .map((l) => (
            <motion.div key={l.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luxury-card rounded-2xl p-6 border border-gold/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-white/10 flex items-center justify-center">
                  {l.thumbnail_url ? <img src={l.thumbnail_url} alt={l.title} className="w-full h-full object-cover" /> : <BookOpen className="w-8 h-8 text-white" />}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">{l.title}</h3>
                  <p className="text-white/60 text-sm line-clamp-2">{l.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs mb-3">
                <span className={`px-2 py-1 rounded-full ${l.is_active ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{l.is_active ? 'نشطة' : 'غير نشطة'}</span>
                <span className={`px-2 py-1 rounded-full ${l.is_free ? 'bg-blue-500/20 text-blue-400' : 'bg-gold/20 text-gold'}`}>{l.is_free ? 'مجانية' : 'مدفوعة'}</span>
                <span className="px-2 py-1 rounded-full bg-white/10 text-white/60">ترتيب: {l.order_index}</span>
                <span className="px-2 py-1 rounded-full bg-white/10 text-white/60">مدة: {l.duration_minutes} دقيقة</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(l)} className="flex-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all">تعديل</button>
                <button onClick={() => setThumb(l)} className="px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all"><Camera className="w-4 h-4" /></button>
                <button onClick={() => onManageContent(l)} className="flex-1 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-all">المحتوى</button>
                <button onClick={() => remove(l)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleActive(l)} className="flex-1 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">تفعيل/تعطيل</button>
                <button onClick={() => toggleFree(l)} className={`flex-1 px-3 py-1 rounded-lg transition-all ${l.is_free ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' : 'bg-gold/20 text-gold hover:bg-gold/30'}`}>{l.is_free ? 'مجانية' : 'مدفوعة'}</button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => move(l, -1)} className="flex-1 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-1"><ArrowUp className="w-4 h-4" /> أعلى</button>
                <button onClick={() => move(l, 1)} className="flex-1 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all flex items-center justify-center gap-1"><ArrowDown className="w-4 h-4" /> أسفل</button>
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
              <h3 className="text-2xl font-bold gradient-text mb-6">{editing ? 'تعديل محاضرة' : 'إضافة محاضرة'}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">العنوان</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="عنوان المحاضرة" />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">الترتيب</label>
                  <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value || '0') })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="text-white/70 text-sm mb-2 block">الوصف</label>
                  <textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="وصف المحاضرة" />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">المدة (دقائق)</label>
                  <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value || '0') })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">رابط الصورة</label>
                  <input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white mb-2"
                    placeholder="https://... (اختياري، أو ارفع صورة)"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onSelectThumbnail(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gold file:text-black hover:file:bg-yellow-500/90"
                  />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input id="is_active" type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="w-5 h-5" />
                  <label htmlFor="is_active" className="text-white/80">نشطة</label>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input id="is_free" type="checkbox" checked={form.is_free} onChange={(e) => setForm({ ...form, is_free: e.target.checked })} className="w-5 h-5" />
                  <label htmlFor="is_free" className="text-white/80">مجانية</label>
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
