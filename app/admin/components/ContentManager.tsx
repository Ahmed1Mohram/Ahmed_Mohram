'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Headphones, Video, BookOpen, Plus, Edit, Trash2, X } from 'lucide-react'
import { supabase } from '@/components/providers'
import toast from 'react-hot-toast'

interface Lecture { id: string; title: string }
interface ContentItem {
  id: string
  type: 'video' | 'audio' | 'pdf' | 'text'
  title: string
  description?: string
  content_url?: string
  thumbnail_url?: string
  content_text?: string
  duration_minutes?: number
  order_index: number
  is_downloadable?: boolean
}

export default function ContentManager({ lecture, onBack }: { lecture: Lecture; onBack: () => void }) {
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const [query, setQuery] = useState('')
  const [form, setForm] = useState({
    type: 'video' as 'video' | 'audio' | 'pdf' | 'text',
    title: '',
    description: '',
    content_url: '',
    thumbnail_url: '',
    content_text: '',
    duration_minutes: 0,
    is_downloadable: false,
    order_index: 1,
  })

  useEffect(() => { fetchItems() }, [lecture?.id])

  const fetchItems = async () => {
    if (!lecture?.id) return
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/content?lectureId=${encodeURIComponent(lecture.id)}`, { cache: 'no-store' })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || 'failed')
      setItems((json.items || []) as ContentItem[])
    } catch (e) {
      toast.error('فشل جلب المحتوى')
    } finally {
      setLoading(false)
    }
  }

  const acceptFor = (type: string) => {
    // دعم صيغ أكثر من الملفات بحسب النوع
    switch (type) {
      case 'video':
        return 'video/*,.mkv,.avi,.mov,.mp4,.wmv,.flv,.webm,.m4v'
      case 'audio':
        return 'audio/*,.mp3,.wav,.ogg,.m4a,.aac,.flac,.wma,.opus,.aiff'
      case 'pdf':
        // دعم ملفات PDF و PowerPoint و Word و Excel
        return '.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.odt,.odp,.ods,.rtf'
      case 'doc':
        // نوع جديد للمستندات بشكل عام
        return '.pdf,.pptx,.ppt,.docx,.doc,.xlsx,.xls,.odt,.odp,.ods,.rtf'
      default:
        return '*/*'
    }
  }

  const [uploading, setUploading] = useState(false)
  const [uploadBytes, setUploadBytes] = useState(0)
  const [uploadTotal, setUploadTotal] = useState(0)
  const [uploadStartTime, setUploadStartTime] = useState<number | null>(null)

  const onSelectFile = async (file?: File | null) => {
    if (!file) return
    try {
      setUploading(true)
      setUploadBytes(0)
      setUploadTotal(file.size)
      setUploadStartTime(Date.now())

      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', form.type)
      fd.append('lectureId', String(lecture.id))

      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('POST', '/api/upload')

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            setUploadTotal(event.total)
            setUploadBytes(event.loaded)
          }
        }

        xhr.onreadystatechange = () => {
          if (xhr.readyState === XMLHttpRequest.DONE) {
            if (xhr.status >= 200 && xhr.status < 300) {
              try {
                const json = JSON.parse(xhr.responseText || '{}')
                if (!json?.ok || !json.url) {
                  reject(new Error(json?.error || 'upload failed'))
                  return
                }
                setForm(prev => ({ ...prev, content_url: json.url }))
                toast.success('تم رفع الملف')
                resolve()
              } catch (err) {
                reject(err)
              }
            } else {
              reject(new Error('upload failed'))
            }
          }
        }

        xhr.onerror = () => {
          reject(new Error('upload failed'))
        }

        xhr.send(fd)
      })
    } catch (e) {
      console.error('Upload error:', e)
      toast.error('فشل رفع الملف')
    } finally {
      setUploading(false)
      setUploadStartTime(null)
    }
  }

  const onSelectThumbnail = async (file?: File | null) => {
    if (!file) return
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('folder', 'content-thumbnails')
      fd.append('lectureId', String(lecture.id))

      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok || !json?.ok || !json.url) {
        throw new Error(json?.error || 'upload failed')
      }

      setForm(prev => ({ ...prev, thumbnail_url: json.url }))
      toast.success('تم رفع صورة المحتوى')
    } catch (e) {
      console.error('Thumbnail upload error:', e)
      toast.error('فشل رفع صورة المحتوى')
    }
  }

  const openAdd = () => {
    setEditing(null)
    setForm({
      type: 'video',
      title: '',
      description: '',
      content_url: '',
      thumbnail_url: '',
      content_text: '',
      duration_minutes: 0,
      is_downloadable: false,
      order_index: (items[items.length-1]?.order_index || 0) + 1,
    })
    setShowForm(true)
  }

  const openEdit = (it: ContentItem) => {
    setEditing(it)
    setForm({
      type: it.type,
      title: it.title || '',
      description: it.description || '',
      content_url: it.content_url || '',
      thumbnail_url: it.thumbnail_url || '',
      content_text: it.content_text || '',
      duration_minutes: it.duration_minutes || 0,
      is_downloadable: !!it.is_downloadable,
      order_index: it.order_index || 1,
    })
    setShowForm(true)
  }

  const save = async () => {
    try {
      if (!form.title) { toast.error('أدخل عنوان المحتوى'); return }
      // Simple validation: URL for non-text, text for text
      if (form.type === 'text' && !form.content_text) { toast.error('أدخل نص الشرح'); return }
      if (form.type !== 'text' && !form.content_url) { toast.error('أدخل رابط المحتوى'); return }

      const payload: any = {
        type: form.type,
        title: form.title,
        description: form.description || null,
        content_url: form.type === 'text' ? null : (form.content_url || null),
        thumbnail_url: form.thumbnail_url || null,
        content_text: form.type === 'text' ? (form.content_text || '') : null,
        duration_minutes: form.duration_minutes || null,
        is_downloadable: form.is_downloadable,
        order_index: form.order_index,
      }

      if (editing) {
        const res = await fetch('/api/admin/content', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editing.id, ...payload })
        })
        if (!res.ok) throw new Error('update failed')
        toast.success('تم تحديث المحتوى')
      } else {
        const res = await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lecture_id: lecture.id, ...payload })
        })
        if (!res.ok) throw new Error('create failed')
        toast.success('تم إضافة المحتوى')
        try {
          await fetch('/api/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: 'content_created', data: { title: form.title, type: form.type, lecture: lecture.title } })
          })
          await fetch('/api/notifications', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'content_created',
              title: `محتوى جديد في ${lecture.title}`,
              message: `تم إضافة ${form.type === 'video' ? 'فيديو' : form.type === 'audio' ? 'ريكورد' : form.type === 'pdf' ? 'ملف PDF' : 'شرح'} بعنوان: ${form.title}`
            })
          })
        } catch {}
      }
      setShowForm(false)
      fetchItems()
    } catch (e) {
      toast.error('فشل الحفظ')
    }
  }

  const remove = async (it: ContentItem) => {
    if (!window.confirm(`حذف ${it.title}؟`)) return
    try {
      const res = await fetch(`/api/admin/content?id=${encodeURIComponent(it.id)}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('delete failed')
      toast.success('تم الحذف')
      fetchItems()
    } catch (e) {
      toast.error('فشل الحذف')
    }
  }

  const toggleDownloadable = async (it: ContentItem) => {
    try {
      const res = await fetch('/api/admin/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, is_downloadable: !it.is_downloadable }) })
      if (!res.ok) throw new Error('toggle failed')
      setItems(prev => prev.map(p => p.id === it.id ? { ...p, is_downloadable: !it.is_downloadable } : p))
    } catch {
      toast.error('فشل تغيير قابلية التحميل')
    }
  }

  const move = async (it: ContentItem, direction: -1 | 1) => {
    try {
      const res = await fetch('/api/admin/content/reorder', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: it.id, lecture_id: lecture.id, direction }) })
      if (!res.ok) throw new Error('reorder failed')
      const sorted = [...items].sort((a, b) => a.order_index - b.order_index)
      const idx = sorted.findIndex(x => x.id === it.id)
      const targetIdx = idx + direction
      if (targetIdx < 0 || targetIdx >= sorted.length) return
      const other = sorted[targetIdx]
      setItems(prev => prev.map(x => x.id === it.id ? { ...x, order_index: other.order_index } : x)
        .map(x => x.id === other.id ? { ...x, order_index: it.order_index } : x))
    } catch {
      toast.error('فشل تغيير الترتيب')
    }
  }

  const iconFor = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />
      case 'audio': return <Headphones className="w-5 h-5" />
      case 'pdf': return <FileText className="w-5 h-5" />
      case 'doc': return <FileText className="w-5 h-5" />
      default: return <BookOpen className="w-5 h-5" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2 gap-3">
        <button onClick={onBack} className="px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">عودة للمحاضرات</button>
        <h2 className="text-2xl font-bold gradient-text">محتوى المحاضرة: {lecture?.title}</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث بالعنوان/الوصف/النوع"
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40 focus:border-gold/50 transition-all"
          />
          <button onClick={openAdd} className="px-4 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-lg hover:shadow-gold-glow transition-all flex items-center gap-2">
            <Plus className="w-5 h-5" /> إضافة محتوى
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-8"><div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div></div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...items]
            .sort((a,b) => a.order_index - b.order_index)
            .filter(it => {
              if (!query) return true
              const q = query.toLowerCase()
              return it.title.toLowerCase().includes(q) || (it.description || '').toLowerCase().includes(q) || it.type.toLowerCase().includes(q)
            })
            .map((it) => (
            <motion.div key={it.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="luxury-card rounded-2xl p-6 border border-gold/20">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-white">
                  {iconFor(it.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{it.title}</h3>
                  <p className="text-white/60 text-sm line-clamp-2">{it.description}</p>
                </div>
              </div>
              <div className="text-xs text-white/70 space-y-1 mb-3">
                <p>النوع: {it.type}</p>
                {it.content_url && <p className="break-all">الرابط: {it.content_url}</p>}
                {it.content_text && <p className="line-clamp-2">نص: {it.content_text}</p>}
                <p>المدة: {it.duration_minutes || 0} دقيقة</p>
                <p>الترتيب: {it.order_index}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(it)} className="flex-1 px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all">تعديل</button>
                <button onClick={() => remove(it)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={() => toggleDownloadable(it)} className={`flex-1 px-3 py-1 rounded-lg transition-all ${it.is_downloadable ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' : 'bg-white/10 text-white hover:bg-white/20'}`}>{it.is_downloadable ? 'قابل للتحميل ✓' : 'غير قابل للتحميل'}</button>
              </div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => move(it, -1)} className="flex-1 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">رفع</button>
                <button onClick={() => move(it, 1)} className="flex-1 px-3 py-1 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-all">خفض</button>
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
              <h3 className="text-2xl font-bold gradient-text mb-6">{editing ? 'تعديل محتوى' : 'إضافة محتوى'}</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-white/70 text-sm mb-2 block">النوع</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as any })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                    <option value="video">فيديو</option>
                    <option value="audio">ملف صوتي</option>
                    <option value="pdf">PDF</option>
                    <option value="doc">مستندات (PowerPoint/Word/Excel)</option>
                    <option value="text">شرح الدكتور</option>
                  </select>
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">العنوان</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="عنوان المحتوى" />
                </div>
                {form.type !== 'text' ? (
                  <div className="md:col-span-2">
                    <label className="text-white/70 text-sm mb-2 block">الرابط</label>
                    <input value={form.content_url} onChange={(e) => setForm({ ...form, content_url: e.target.value })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="https://..." />
                    <div className="mt-2 flex items-center gap-2">
                      <input
                        type="file"
                        accept={acceptFor(form.type)}
                        onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
                        disabled={uploading}
                        className="block w-full text-sm text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gold file:text-black hover:file:bg-yellow-500/90"
                      />
                      {uploading && (
                        (() => {
                          const total = uploadTotal || 0
                          const loaded = uploadBytes
                          const percent = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0
                          const loadedMB = total > 0 ? loaded / (1024 * 1024) : 0
                          const totalMB = total > 0 ? total / (1024 * 1024) : 0
                          let remainingSeconds = 0
                          if (uploadStartTime && loaded > 0 && total > 0) {
                            const elapsed = (Date.now() - uploadStartTime) / 1000
                            const speed = loaded / elapsed
                            if (speed > 0) {
                              remainingSeconds = Math.max(0, Math.round((total - loaded) / speed))
                            }
                          }

                          return (
                            <div className="flex flex-col gap-1 min-w-[180px]">
                              <div className="flex justify-between text-[10px] text-white/70">
                                <span>جاري الرفع...</span>
                                <span>{percent}%</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-gold to-yellow-500"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                              <div className="flex justify-between text-[10px] text-white/60">
                                <span>{loadedMB.toFixed(1)} / {totalMB.toFixed(1)} ميجا</span>
                                {remainingSeconds > 0 && <span>متبقي ~ {remainingSeconds}s</span>}
                              </div>
                            </div>
                          )
                        })()
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="md:col-span-2">
                    <label className="text-white/70 text-sm mb-2 block">نص الشرح</label>
                    <textarea rows={4} value={form.content_text} onChange={(e) => setForm({ ...form, content_text: e.target.value })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="اكتب الشرح هنا" />
                  </div>
                )}
                <div className="md:col-span-2">
                  <label className="text-white/70 text-sm mb-2 block">صورة المحتوى (اختياري)</label>
                  <input
                    value={form.thumbnail_url}
                    onChange={(e) => setForm({ ...form, thumbnail_url: e.target.value })}
                    className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white mb-2"
                    placeholder="https://... (أو ارفع صورة)"
                  />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => onSelectThumbnail(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-white/70 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-gold file:text-black hover:file:bg-yellow-500/90"
                  />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">المدة (دقائق)</label>
                  <input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value || '0') })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">الترتيب</label>
                  <input type="number" value={form.order_index} onChange={(e) => setForm({ ...form, order_index: parseInt(e.target.value || '0') })} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <input id="is_downloadable" type="checkbox" checked={form.is_downloadable} onChange={(e) => setForm({ ...form, is_downloadable: e.target.checked })} className="w-5 h-5" />
                  <label htmlFor="is_downloadable" className="text-white/80">قابل للتحميل</label>
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
