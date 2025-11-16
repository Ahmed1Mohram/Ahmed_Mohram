'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Save, RefreshCw, Globe, Users, BookOpen, Award } from 'lucide-react'
import toast from 'react-hot-toast'

interface Settings {
  hero_title: string
  hero_description: string
  total_students: string
  total_courses: string
  success_rate: string
  active_students: string
  total_teachers: string
  happy_students: string
  available_lessons: string
  phone_number: string
  whatsapp_number: string
  facebook_url: string
  twitter_url: string
  instagram_url: string
  youtube_url: string
}

export default function SiteSettings() {
  const [settings, setSettings] = useState<Settings>({
    hero_title: '',
    hero_description: '',
    total_students: '',
    total_courses: '',
    success_rate: '',
    active_students: '',
    total_teachers: '',
    happy_students: '',
    available_lessons: '',
    phone_number: '',
    whatsapp_number: '',
    facebook_url: '',
    twitter_url: '',
    instagram_url: '',
    youtube_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/site-settings')
      const data = await response.json()
      
      if (data.success && data.settings) {
        setSettings(data.settings)
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
      toast.error('فشل جلب الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      const response = await fetch('/api/site-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      })

      const data = await response.json()

      if (data.success) {
        toast.success('✅ تم حفظ الإعدادات بنجاح')
      } else {
        toast.error(data.error || 'فشل حفظ الإعدادات')
      }
    } catch (error) {
      console.error('Error saving settings:', error)
      toast.error('حدث خطأ أثناء الحفظ')
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (field: keyof Settings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold gradient-text">إعدادات الصفحة الرئيسية</h2>
        <div className="flex gap-3">
          <button
            onClick={fetchSettings}
            disabled={loading}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-all flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            تحديث
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-gradient-to-r from-gold to-gold-dark text-black rounded-lg hover:opacity-90 transition-all flex items-center gap-2 font-bold"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>

      {/* Hero Section Settings */}
      <div className="luxury-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Globe className="w-6 h-6 text-gold" />
          <h3 className="text-xl font-bold text-white">قسم البطل (Hero Section)</h3>
        </div>

        <div>
          <label className="block text-white/80 mb-2 text-sm">العنوان الرئيسي</label>
          <input
            type="text"
            value={settings.hero_title}
            onChange={(e) => handleChange('hero_title', e.target.value)}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
            placeholder="مرحباً بك في منصة أحمد محرم"
          />
        </div>

        <div>
          <label className="block text-white/80 mb-2 text-sm">الوصف</label>
          <textarea
            value={settings.hero_description}
            onChange={(e) => handleChange('hero_description', e.target.value)}
            rows={3}
            className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all resize-none"
            placeholder="منصة تعليمية رائدة..."
          />
        </div>
      </div>

      {/* Statistics Settings */}
      <div className="luxury-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-6 h-6 text-gold" />
          <h3 className="text-xl font-bold text-white">الإحصائيات</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/80 mb-2 text-sm">إجمالي الطلاب</label>
            <input
              type="text"
              value={settings.total_students}
              onChange={(e) => handleChange('total_students', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="50,000"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">الطلاب النشطون</label>
            <input
              type="text"
              value={settings.active_students}
              onChange={(e) => handleChange('active_students', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="50K+"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">عدد الدورات</label>
            <input
              type="text"
              value={settings.total_courses}
              onChange={(e) => handleChange('total_courses', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="500+"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">نسبة النجاح</label>
            <input
              type="text"
              value={settings.success_rate}
              onChange={(e) => handleChange('success_rate', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="98%"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">عدد المدرسين</label>
            <input
              type="text"
              value={settings.total_teachers}
              onChange={(e) => handleChange('total_teachers', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="50+"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">الطلاب السعداء</label>
            <input
              type="text"
              value={settings.happy_students}
              onChange={(e) => handleChange('happy_students', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="10,000+"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">الدروس المتاحة</label>
            <input
              type="text"
              value={settings.available_lessons}
              onChange={(e) => handleChange('available_lessons', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="500+"
            />
          </div>
        </div>
      </div>

      {/* Contact Settings */}
      <div className="luxury-card rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-6 h-6 text-gold" />
          <h3 className="text-xl font-bold text-white">معلومات الاتصال</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-white/80 mb-2 text-sm">رقم الهاتف</label>
            <input
              type="text"
              value={settings.phone_number}
              onChange={(e) => handleChange('phone_number', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="01005209667"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">رقم واتساب</label>
            <input
              type="text"
              value={settings.whatsapp_number}
              onChange={(e) => handleChange('whatsapp_number', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="201005209667"
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">رابط Facebook</label>
            <input
              type="text"
              value={settings.facebook_url}
              onChange={(e) => handleChange('facebook_url', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="https://facebook.com/..."
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">رابط Twitter</label>
            <input
              type="text"
              value={settings.twitter_url}
              onChange={(e) => handleChange('twitter_url', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="https://twitter.com/..."
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">رابط Instagram</label>
            <input
              type="text"
              value={settings.instagram_url}
              onChange={(e) => handleChange('instagram_url', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="https://instagram.com/..."
            />
          </div>

          <div>
            <label className="block text-white/80 mb-2 text-sm">رابط YouTube</label>
            <input
              type="text"
              value={settings.youtube_url}
              onChange={(e) => handleChange('youtube_url', e.target.value)}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:border-gold/50 transition-all"
              placeholder="https://youtube.com/..."
            />
          </div>
        </div>
      </div>

      {/* Save Button at Bottom */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-8 py-3 bg-gradient-to-r from-gold to-gold-dark text-black rounded-lg hover:opacity-90 transition-all flex items-center gap-2 font-bold text-lg"
        >
          <Save className="w-5 h-5" />
          {saving ? 'جاري الحفظ...' : 'حفظ جميع التغييرات'}
        </button>
      </div>
    </motion.div>
  )
}
