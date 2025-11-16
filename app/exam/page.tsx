'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Clock, Shield, AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'

export default function ExamPage() {
  const router = useRouter()
  const [started, setStarted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [remaining, setRemaining] = useState(30 * 60)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const tickRef = useRef<NodeJS.Timeout | null>(null)
  const examId = 'demo-exam-1'

  const reportViolation = async (reason: string, meta: any = {}) => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const userId = userStr ? (JSON.parse(userStr)?.id || null) : null
      await fetch('/api/exam-violation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, examId, reason, meta, ts: Date.now() })
      })
    } catch {}
  }

  const lockExam = async (reason: string, meta: any = {}) => {
    if (locked) return
    setLocked(true)
    await reportViolation(reason, meta)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  const startTimer = () => {
    if (tickRef.current) clearInterval(tickRef.current as any)
    tickRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(tickRef.current as any)
          lockExam('انتهى الوقت')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const requestFs = async () => {
    const el: any = document.documentElement
    if (el.requestFullscreen) await el.requestFullscreen()
    // بعض المتصفحات تحتاج webkit/ms
    if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    if (el.msRequestFullscreen) el.msRequestFullscreen()
  }

  const startExam = async () => {
    await requestFs()
    setStarted(true)
    startTimer()
  }

  useEffect(() => {
    if (!started) return

    const onVisibility = () => {
      if (document.hidden) lockExam('التبديل إلى تبويب آخر')
    }
    const onBlur = () => lockExam('خروج من نافذة الامتحان')
    const onFsChange = () => {
      const fs = document.fullscreenElement || (document as any).webkitFullscreenElement || (document as any).msFullscreenElement
      if (!fs) lockExam('الخروج من وضع ملء الشاشة')
    }
    const onContext = (e: Event) => { e.preventDefault(); lockExam('محاولة فتح القائمة اليمنى') }
    const onCopy = (e: Event) => { e.preventDefault(); lockExam('محاولة نسخ المحتوى') }
    const onPaste = (e: Event) => { e.preventDefault(); lockExam('محاولة لصق المحتوى') }
    const onKey = (e: KeyboardEvent) => {
      const ctrl = e.ctrlKey || e.metaKey
      const combo = ctrl && (['c','v','x','a','u','p'].includes(e.key.toLowerCase()) || e.shiftKey)
      const dev = e.key === 'F12' || (ctrl && e.shiftKey && ['I','J','C'].includes(e.key.toUpperCase()))
      if (combo || dev) { e.preventDefault(); lockExam('اختصار محظور/أدوات المطور') }
    }

    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', onBlur)
    document.addEventListener('fullscreenchange', onFsChange)
    document.addEventListener('webkitfullscreenchange', onFsChange as any)
    document.addEventListener('msfullscreenchange', onFsChange as any)
    document.addEventListener('contextmenu', onContext)
    document.addEventListener('copy', onCopy)
    document.addEventListener('cut', onCopy)
    document.addEventListener('paste', onPaste)
    document.addEventListener('keydown', onKey)

    const devtoolsCheck = setInterval(() => {
      const threshold = 160
      // بدائية: إذا تغير الفرق بين outer/inner بشكل كبير
      if (Math.abs((window.outerWidth - window.innerWidth)) > threshold || Math.abs((window.outerHeight - window.innerHeight)) > threshold) {
        lockExam('فتح أدوات المطور')
      }
    }, 1000)

    return () => {
      clearInterval(devtoolsCheck)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('fullscreenchange', onFsChange)
      document.removeEventListener('webkitfullscreenchange', onFsChange as any)
      document.removeEventListener('msfullscreenchange', onFsChange as any)
      document.removeEventListener('contextmenu', onContext)
      document.removeEventListener('copy', onCopy)
      document.removeEventListener('cut', onCopy)
      document.removeEventListener('paste', onPaste)
      document.removeEventListener('keydown', onKey)
    }
  }, [started])

  useEffect(() => {
    return () => {
      if (tickRef.current) clearInterval(tickRef.current as any)
    }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const ss = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${ss}`
  }

  const onSelect = (qid: string, val: string) => {
    if (locked) return
    setAnswers(prev => ({ ...prev, [qid]: val }))
  }

  const submitExam = async () => {
    if (locked) return
    setLocked(true)
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const userId = userStr ? (JSON.parse(userStr)?.id || null) : null
      const durationSeconds = Math.max(0, (30 * 60) - remaining)
      await fetch('/api/submit-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, examId, answers, durationSeconds })
      })
    } catch {}
    if (tickRef.current) clearInterval(tickRef.current as any)
    setTimeout(() => router.push('/dashboard'), 1000)
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4 select-none">
      <div className="max-w-4xl mx-auto">
        {!started && !locked && (
          <div className="luxury-card rounded-3xl p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4"><Shield className="w-8 h-8 text-gold" /></div>
            <h1 className="text-2xl font-bold mb-2">بدء الامتحان</h1>
            <p className="text-white/70 mb-6">سيتم تشغيل وضع ملء الشاشة ومنع النسخ واللصق والتبديل بين التبويبات. أي محاولة مخالفة ستؤدي لإغلاق الامتحان وإبلاغ المشرف.</p>
            <button onClick={startExam} className="px-6 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-xl">ابدأ الامتحان</button>
          </div>
        )}

        {started && !locked && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/80"><Clock className="w-5 h-5 text-gold" /> <span>الوقت المتبقي: {formatTime(remaining)}</span></div>
              <div className="text-white/60">المحاولة: 1</div>
            </div>
            <div className="luxury-card rounded-3xl p-6 space-y-6">
              <div>
                <div className="font-bold mb-2">1) ما ناتج 2 + 2؟</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {['2','3','4','5'].map(o => (
                    <button key={o} onClick={() => onSelect('q1', o)} className={`p-3 rounded-xl border ${answers['q1']===o? 'border-gold bg-gold/20' : 'border-white/10 bg-white/5'} text-left`}>{o}</button>
                  ))}
                </div>
              </div>
              <div>
                <div className="font-bold mb-2">2) عاصمة مصر؟</div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {['القاهرة','الإسكندرية','أسوان','المنصورة'].map(o => (
                    <button key={o} onClick={() => onSelect('q2', o)} className={`p-3 rounded-xl border ${answers['q2']===o? 'border-gold bg-gold/20' : 'border-white/10 bg-white/5'} text-left`}>{o}</button>
                  ))}
                </div>
              </div>
              <div className="flex justify-end">
                <button onClick={submitExam} className="px-6 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-xl">تسليم</button>
              </div>
            </div>
          </>
        )}

        {locked && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="luxury-card rounded-3xl p-8 text-center border-red-500/30">
            <div className="mx-auto w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-4"><AlertTriangle className="w-8 h-8 text-red-400" /></div>
            <h2 className="text-xl font-bold mb-2 text-red-400">تم غلق الامتحان</h2>
            <p className="text-white/70">تم رصد مخالفة لقواعد الامتحان. تم تسجيل الحالة وسيتم الرجوع إلى لوحة التحكم.</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}