'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Save, Send, Globe } from 'lucide-react'
import toast from 'react-hot-toast'

export default function NotificationCenter() {
  const [templates, setTemplates] = useState<Record<string, string>>({})
  const [broadcast, setBroadcast] = useState('')
  const [loading, setLoading] = useState(false)
  const [webhookStatus, setWebhookStatus] = useState<string>('')
  const [publicUrl, setPublicUrl] = useState<string>('')

  const loadTemplates = async () => {
    try {
      const res = await fetch('/api/notifications/templates', { cache: 'no-store' })
      const data = await res.json()
      setTemplates(data.templates || {})
    } catch {
      toast.error('فشل جلب القوالب')
    }
  }

  useEffect(() => {
    loadTemplates()
    if (typeof window !== 'undefined') {
      setPublicUrl(window.location.origin)
    }
  }, [])

  const save = async (key: string) => {
    try {
      const res = await fetch('/api/notifications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, template: templates[key] })
      })
      if (!res.ok) throw new Error()
      toast.success('تم حفظ القالب')
    } catch {
      toast.error('فشل حفظ القالب')
    }
  }

  const sendBroadcast = async () => {
    if (!broadcast.trim()) return
    setLoading(true)
    try {
      const res = await fetch('/api/telegram/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: broadcast })
      })
      const data = await res.json()
      if (res.ok && data.ok) {
        toast.success(`تم الإرسال (${data.success}/${data.total})`)
        setBroadcast('')
      } else {
        toast.error(`فشل الإرسال${data?.error ? ' - ' + data.error : ''}`)
      }
    } catch {
      toast.error('فشل الإرسال')
    } finally {
      setLoading(false)
    }
  }

  const setWebhook = async () => {
    setWebhookStatus('')
    try {
      const res = await fetch('/api/telegram/set-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ publicUrl }) })
      const data = await res.json()
      if (res.ok && data.ok) {
        setWebhookStatus('✅ تم ضبط Webhook بنجاح')
      } else {
        setWebhookStatus(`❌ فشل ضبط Webhook${data?.description ? ' - ' + data.description : ''}`)
      }
    } catch {
      setWebhookStatus('❌ فشل ضبط Webhook')
    }
  }

  const keys: Array<[string, string]> = [
    ['subject_created', 'عند إضافة مادة جديدة'],
    ['lecture_created', 'عند إضافة محاضرة جديدة'],
    ['content_created', 'عند إضافة محتوى جديد'],
    ['broadcast', 'رسالة عامة']
  ]

  return (
    <div className="space-y-6">
      <div className="luxury-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold gradient-text">إعداد Webhook للبوت</h3>
          <button onClick={setWebhook} className="px-4 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold flex items-center gap-2"><Globe className="w-4 h-4" /> ضبط Webhook</button>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <input value={publicUrl} onChange={e => setPublicUrl(e.target.value)} placeholder="https://domain.com" className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" />
        </div>
        {webhookStatus && <div className="text-sm">{webhookStatus}</div>}
        <p className="text-white/60 text-sm mt-2">تأكد من ضبط TELEGRAM_BOT_TOKEN في المتغيرات ثم اضغط ضبط Webhook.</p>
      </div>

      <div className="luxury-card rounded-2xl p-6">
        <h3 className="text-xl font-bold gradient-text mb-4">القوالب</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {keys.map(([key, label]) => (
            <div key={key} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-white">{label}</div>
                <button onClick={() => save(key)} className="px-3 py-1.5 bg-gold text-black rounded-lg font-bold flex items-center gap-1"><Save className="w-4 h-4" /> حفظ</button>
              </div>
              <textarea
                rows={4}
                value={templates[key] || ''}
                onChange={(e) => setTemplates(prev => ({ ...prev, [key]: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40"
                placeholder="استخدم {{title}}، {{subject}}، {{lecture}}، {{type}}، {{text}}"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="luxury-card rounded-2xl p-6">
        <h3 className="text-xl font-bold gradient-text mb-4">إرسال رسالة جماعية</h3>
        <div className="flex gap-3">
          <textarea rows={3} value={broadcast} onChange={e => setBroadcast(e.target.value)} placeholder="اكتب الرسالة..." className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white" />
          <button disabled={loading} onClick={sendBroadcast} className="px-5 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold flex items-center gap-2"><Send className="w-4 h-4" /> إرسال</button>
        </div>
      </div>
    </div>
  )
}
