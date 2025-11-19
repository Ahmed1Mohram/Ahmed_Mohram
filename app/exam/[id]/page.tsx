'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Clock, Shield, AlertTriangle, CheckCircle } from 'lucide-react'

interface Exam {
  id: string
  title: string
  duration_minutes: number
  questions: { id: string; text: string; type?: 'mcq'|'tf'|'essay'; options?: string[] }[]
}

export default function ExamByIdPage() {
  const router = useRouter()
  const params = useParams()
  const examId = params?.id as string

  const [exam, setExam] = useState<Exam | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [locked, setLocked] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [answers, setAnswers] = useState<Record<string, any>>({})
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null)
  const [cheatArmed, setCheatArmed] = useState(false)
  const [finished, setFinished] = useState(false)
  const [examLockedForUser, setExamLockedForUser] = useState(false)
  const tickRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/exams/${examId}`)
        const json = await res.json()
        if (!json.success) throw new Error(json.error || 'failed')
        const e = json.exam as Exam
        setExam(e)
        setRemaining(Math.max(1, (e.duration_minutes || 60)) * 60)
      } catch (e) {
        // fallback minimal exam to allow UI testing
        setExam({ id: examId, title: 'امتحان', duration_minutes: 30, questions: [] })
        setRemaining(30 * 60)
      } finally {
        setLoading(false)
      }
    }
    if (examId) load()
  }, [examId])

  // التحقق إذا كان الطالب قد دخل هذا الامتحان من قبل وهل مسموح له بالإعادة أم لا
  useEffect(() => {
    const checkPreviousSubmission = async () => {
      try {
        if (!examId) return
        const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
        const userId = userStr ? (JSON.parse(userStr)?.id || null) : null
        if (!userId) return

        const res = await fetch(`/api/submit-exam?examId=${examId}&userId=${encodeURIComponent(userId)}&limit=1`, { cache: 'no-store' })
        const json = await res.json().catch(() => ({} as any))
        const last = (json?.submissions || [])[0]

        if (last && last.allow_retry !== true) {
          setExamLockedForUser(true)
        } else {
          setExamLockedForUser(false)
        }
      } catch {
        // في حالة الخطأ نتجاهل حتى لا نمنع الطالب بدون سبب واضح
      }
    }

    checkPreviousSubmission()
  }, [examId])

  const reportViolation = async (reason: string, meta: any = {}) => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const userId = userStr ? (JSON.parse(userStr)?.id || null) : null
      await fetch('/api/exam-entries', { // record entry/violation lightweight as entry
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          examId,
          reason,
          meta,
          ts: Date.now(),
          battery_level: batteryLevel,
        })
      })
    } catch {}
  }

  const lockExam = async (reason: string, meta: any = {}) => {
    if (finished) return
    if (!cheatArmed && reason !== 'انتهى الوقت') return
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
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android/i.test(((navigator as any).userAgent || ''))
    if (isMobile) return

    const el: any = document.documentElement
    if (el.requestFullscreen) await el.requestFullscreen()
    if (el.webkitRequestFullscreen) el.webkitRequestFullscreen()
    if (el.msRequestFullscreen) el.msRequestFullscreen()
  }

  const startExam = async () => {
    if (examLockedForUser) return
    try {
      await requestFs()
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const userId = userStr ? (JSON.parse(userStr)?.id || null) : null

      let battery_level: number | null = null
      try {
        const nav: any = typeof navigator !== 'undefined' ? (navigator as any) : null
        if (nav && typeof nav.getBattery === 'function') {
          const battery = await nav.getBattery()
          if (battery && typeof battery.level === 'number') {
            battery_level = Math.round(battery.level * 100)
          }
        }
      } catch {}

      if (battery_level !== null) {
        setBatteryLevel(battery_level)
      }

      await fetch('/api/exam-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, examId, battery_level })
      })
    } catch {}
    setStarted(true)
    startTimer()
  }

  useEffect(() => {
    if (!started || finished) return

    const armTimeout = setTimeout(() => setCheatArmed(true), 3000)

    const onVisibility = () => { if (document.hidden) lockExam('التبديل إلى تبويب آخر') }
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

    return () => {
      clearTimeout(armTimeout)
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
  }, [started, finished])

  useEffect(() => {
    return () => { if (tickRef.current) clearInterval(tickRef.current as any) }
  }, [])

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, '0')
    const ss = Math.floor(s % 60).toString().padStart(2, '0')
    return `${m}:${ss}`
  }

  const onSelect = (qid: string, val: any) => {
    if (locked) return
    setAnswers(prev => ({ ...prev, [qid]: val }))
  }

  const submitExam = async () => {
    if (locked || finished) return
    setFinished(true)
    setStarted(false)
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null
      const userId = userStr ? (JSON.parse(userStr)?.id || null) : null
      const durationSeconds = Math.max(0, (Math.max(1, (exam?.duration_minutes || 30)) * 60) - remaining)
      await fetch('/api/submit-exam', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, examId, answers, durationSeconds })
      })
    } catch {}
    if (tickRef.current) clearInterval(tickRef.current as any)
    setTimeout(() => router.push('/dashboard'), 2000)
  }

  if (loading || !exam) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-gold border-t-transparent rounded-full animate-spin"/>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black py-8 px-4 select-none">
      <div className="max-w-4xl mx-auto">
        {!started && !locked && !finished && !examLockedForUser && (
          <div className="luxury-card rounded-3xl p-8 text-center">
            <div className="mx-auto w-16 h-16 rounded-full bg-gold/20 flex items-center justify-center mb-4"><Shield className="w-8 h-8 text-gold" /></div>
            <h1 className="text-2xl font-bold mb-2">{exam.title}</h1>
            <p className="text-white/70 mb-4">المدة: {exam.duration_minutes} دقيقة — عدد الأسئلة: {exam.questions?.length || 0}</p>
            <button onClick={startExam} className="px-6 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-xl">ابدأ الامتحان</button>
          </div>
        )}

        {!started && !locked && !finished && examLockedForUser && (
          <div className="luxury-card rounded-3xl p-8 text-center border-amber-500/40">
            <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/20 flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-amber-300" />
            </div>
            <h2 className="text-xl font-bold mb-2 text-amber-300">لا يمكنك دخول هذا الامتحان الآن</h2>
            <p className="text-white/70 mb-2">لقد قمت بأداء هذا الامتحان من قبل، ولا يمكن إعادة المحاولة إلا بعد موافقة المشرف من لوحة الأدمن.</p>
            <p className="text-white/50 text-sm">تواصل مع أحمد محرم إذا كنت تحتاج إلى فتح محاولة جديدة لهذا الامتحان.</p>
          </div>
        )}

        {started && !locked && !finished && (
          <>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/80"><Clock className="w-5 h-5 text-gold" /> <span>الوقت المتبقي: {formatTime(remaining)}</span></div>
              <div className="text-white/60">المحاولة: 1</div>
            </div>
            <div className="luxury-card rounded-3xl p-6 space-y-6">
              {exam.questions?.map((q) => {
                const type = q.type || (Array.isArray(q.options) ? 'mcq' : 'mcq')
                return (
                  <div key={q.id}>
                    <div className="font-bold mb-2">{q.text}</div>
                    {type === 'mcq' && (
                      <div className="grid sm:grid-cols-2 gap-2">
                        {(q.options || []).map((o) => (
                          <button key={o} onClick={() => onSelect(q.id, o)} className={`p-3 rounded-xl border ${answers[q.id]===o? 'border-gold bg-gold/20' : 'border-white/10 bg-white/5'} text-left`}>{o}</button>
                        ))}
                      </div>
                    )}
                    {type === 'tf' && (
                      <div className="grid grid-cols-2 gap-2">
                        {['true','false'].map(val => (
                          <button key={val} onClick={() => onSelect(q.id, val)} className={`p-3 rounded-xl border ${answers[q.id]===val? 'border-gold bg-gold/20' : 'border-white/10 bg-white/5'} text-center`}>
                            {val==='true' ? 'صح' : 'خطأ'}
                          </button>
                        ))}
                      </div>
                    )}
                    {type === 'essay' && (
                      <div>
                        <textarea
                          className="w-full min-h-[100px] px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white"
                          placeholder="اكتب إجابتك هنا"
                          value={answers[q.id] || ''}
                          onChange={(e)=> onSelect(q.id, e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
              <div className="flex justify-end">
                <button onClick={submitExam} className="px-6 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black font-bold rounded-xl">تسليم</button>
              </div>
            </div>
          </>
        )}

        {finished && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="luxury-card rounded-3xl p-8 text-center border-green-500/30">
            <div className="mx-auto w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4"><CheckCircle className="w-8 h-8 text-green-400" /></div>
            <h2 className="text-xl font-bold mb-2 text-green-400">تم تسليم الامتحان بنجاح</h2>
            <p className="text-white/70">تم حفظ إجاباتك وسيتم عرض النتيجة في لوحة التحكم.</p>
          </motion.div>
        )}

        {locked && !finished && (
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
