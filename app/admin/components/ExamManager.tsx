'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, Clock, Eye, FileText, Plus, ToggleLeft, ToggleRight, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/components/providers'

interface Subject {
  id: string
  title: string
}

interface QuestionOption { value: string }
interface Question {
  id: string
  text: string
  type: 'mcq' | 'tf' | 'essay'
  options: QuestionOption[]
  correct?: string | boolean
  acceptable?: string[]
}

export default function ExamManager() {
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [exams, setExams] = useState<any[]>([])
  const [selectedExam, setSelectedExam] = useState<any | null>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [submissions, setSubmissions] = useState<any[]>([])
  const [examDetails, setExamDetails] = useState<any | null>(null)
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null)
  const [showCertificate, setShowCertificate] = useState(false)
  const [notifTitle, setNotifTitle] = useState('')
  const [notifMessage, setNotifMessage] = useState('')
  const [notifSending, setNotifSending] = useState(false)

  const [form, setForm] = useState({
    title: '',
    subject_id: '',
    duration_minutes: 60,
    pass_threshold: 60,
    is_published: false,
  })
  const [questions, setQuestions] = useState<Question[]>([{
    id: 'q1', text: '', type: 'mcq', options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }], correct: ''
  }])

  useEffect(() => {
    fetchSubjects()
    fetchExams()
  }, [])

  const fetchSubjects = async () => {
    try {
      const { data } = await supabase.from('subjects').select('id,title').order('title')
      setSubjects(data || [])
    } catch {}
  }

  const fetchExams = async () => {
    try {
      const res = await fetch('/api/exams?all=1')
      const json = await res.json()
      if (json.success) setExams(json.exams || [])
    } catch (e) {
      toast.error('فشل تحميل الامتحانات')
    }
  }

  const createExam = async () => {
    if (!form.title || questions.length === 0 || !questions[0].text) {
      toast.error('يرجى إدخال عنوان وسؤال واحد على الأقل')
      return
    }
    try {
      setLoading(true)
      const payload = {
        title: form.title,
        subject_id: form.subject_id || null,
        duration_minutes: form.duration_minutes,
        pass_threshold: form.pass_threshold,
        is_published: form.is_published,
        questions: questions.map(q => ({
          id: q.id,
          text: q.text,
          type: q.type,
          options: q.type === 'mcq' ? q.options.map(o => o.value) : [],
          correct: q.type === 'tf' ? (!!q.correct) : (q.type === 'mcq' ? String(q.correct || '') : undefined),
          acceptable: q.type === 'essay' ? (q.acceptable || []).filter(Boolean) : undefined,
        })),
      }
      const res = await fetch('/api/exams', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error || 'فشل إنشاء الامتحان')
      toast.success('تم إنشاء الامتحان')
      try {
        const subjectTitle = subjects.find(s => s.id === form.subject_id)?.title || ''
        await fetch('/api/notify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'exam_created',
            data: { title: form.title, subject: subjectTitle }
          })
        })
      } catch {}
      setForm({ title: '', subject_id: '', duration_minutes: 60, pass_threshold: 60, is_published: false })
      setQuestions([{ id: 'q1', text: '', type: 'mcq', options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }], correct: '' }])
      fetchExams()
    } catch (e: any) {
      toast.error(e?.message || 'حدث خطأ')
    } finally {
      setLoading(false)
    }
  }

  const togglePublish = async (exam: any) => {
    try {
      const res = await fetch(`/api/exams/${exam.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ is_published: !exam.is_published }) })
      const json = await res.json()
      if (!json.success) throw new Error(json.error)
      toast.success(!exam.is_published ? 'تم نشر الامتحان' : 'تم إلغاء نشر الامتحان')
      fetchExams()
    } catch (e: any) {
      toast.error(e?.message || 'خطأ')
    }
  }

  const loadExamData = async (exam: any) => {
    setSelectedExam(exam)
    setSelectedSubmission(null)
    setExamDetails(null)
    try {
      const [entriesRes, subsRes, examRes] = await Promise.all([
        fetch(`/api/exam-entries?examId=${exam.id}`),
        fetch(`/api/submit-exam?examId=${exam.id}`),
        fetch(`/api/exams/${exam.id}`),
      ])
      const entriesJson = await entriesRes.json()
      const subsJson = await subsRes.json()
      const examJson = await examRes.json()
      setEntries(entriesJson.entries || [])
      setSubmissions(subsJson.submissions || [])
      if (examJson.success && examJson.exam) {
        setExamDetails(examJson.exam)
      }
    } catch {}
  }

  const addQuestion = () => {
    const idx = questions.length + 1
    setQuestions(prev => [...prev, { id: `q${idx}`, text: '', type: 'mcq', options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }], correct: '' }])
  }

  const totalQuestions = useMemo(() => questions.length, [questions])

  const submissionsWithMeta = useMemo(() => {
    return submissions.map((su: any) => {
      const relatedEntries = entries.filter((en: any) => en.exam_id === su.exam_id && en.user_id === su.user_id)
      const violation = relatedEntries.find((en: any) => en.reason)
      const battery = violation?.battery_level ?? relatedEntries[0]?.battery_level ?? null
      return {
        ...su,
        _hasViolation: !!violation,
        _violationReason: violation?.reason || null,
        _batteryLevel: battery,
      }
    })
  }, [submissions, entries])

  const normalizeAnswer = (v: any) => {
    if (v === undefined || v === null) return ''
    return String(v)
      .toLowerCase()
      .replace(/[\s\.,;:!؟،'"\-_\\/\(\)\[\]\{\}]+/g, '')
      .trim()
  }

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold gradient-text">إدارة الامتحانات</h2>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="luxury-card rounded-2xl p-6">
          <h3 className="text-lg font-bold text-white mb-4">إنشاء امتحان جديد</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="text-white/70 text-sm mb-2 block">العنوان</label>
              <input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white" placeholder="عنوان الامتحان" />
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">المادة</label>
              <select value={form.subject_id} onChange={e=>setForm({...form,subject_id:e.target.value})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white">
                <option value="">— بدون —</option>
                {subjects.map(s=> <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">المدة (دقائق)</label>
              <input type="number" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:parseInt(e.target.value||'0')})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"/>
            </div>
            <div>
              <label className="text-white/70 text-sm mb-2 block">نسبة النجاح (%)</label>
              <input type="number" value={form.pass_threshold} onChange={e=>setForm({...form,pass_threshold:parseInt(e.target.value||'0')})} className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white"/>
            </div>
            <div className="flex items-center gap-3">
              <input id="publish" type="checkbox" checked={form.is_published} onChange={e=>setForm({...form,is_published:e.target.checked})} />
              <label htmlFor="publish" className="text-white/80">نشر الامتحان</label>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-white/90 font-bold">الأسئلة ({totalQuestions})</h4>
              <button onClick={addQuestion} className="px-3 py-1.5 bg-white/10 text-white rounded-lg hover:bg-white/20 flex items-center gap-1"><Plus className="w-4 h-4"/> سؤال</button>
            </div>
            {questions.map((q, qi)=> (
              <div key={q.id} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-white/70 text-sm">سؤال {qi + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setQuestions(prev => prev.filter((_, i) => i !== qi))
                      }}
                      className="text-xs px-2 py-1 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30"
                    >
                      حذف السؤال
                    </button>
                  )}
                </div>
                <div>
                  <label className="text-white/70 text-sm mb-2 block">نص السؤال</label>
                  <input value={q.text} onChange={e=>{
                    const v=e.target.value; setQuestions(prev=>prev.map((qq,i)=> i===qi? {...qq, text:v}:qq))
                  }} className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white"/>
                </div>
                <div className="grid md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">النوع</label>
                    <select value={q.type} onChange={e=>{
                      const t = e.target.value as 'mcq'|'tf'|'essay'
                      setQuestions(prev=>prev.map((qq,i)=> i===qi? {
                        ...qq,
                        type: t,
                        options: t==='mcq'? (qq.options?.length? qq.options: [{value:''},{value:''},{value:''},{value:''}]): [],
                        correct: t==='tf'? false : (t==='mcq'? '': undefined),
                        acceptable: t==='essay'? (qq.acceptable || ['']): undefined
                      }:qq))
                    }} className="w-full px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white">
                      <option value="mcq">اختياري</option>
                      <option value="tf">صح / خطأ</option>
                      <option value="essay">مقالي</option>
                    </select>
                  </div>
                </div>
                {q.type === 'mcq' && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {q.options.map((op, oi)=> (
                        <div key={oi} className="flex items-center gap-3 w-full">
                          <div className="flex items-center gap-1 shrink-0">
                            <input
                              type="radio"
                              name={`correct-${q.id}`}
                              checked={String(q.correct || '') === String(op.value || '')}
                              onChange={()=>{
                                const selected = op.value || ''
                                setQuestions(prev=>prev.map((qq,i)=> i===qi? { ...qq, correct: selected }: qq))
                              }}
                              className="w-4 h-4"
                            />
                            <span className="text-white/60 text-xs">الصحيح</span>
                          </div>
                          <input
                            value={op.value}
                            placeholder={`اختيار ${oi+1}`}
                            onChange={e=>{
                              const v=e.target.value;
                              setQuestions(prev=>prev.map((qq,i)=> {
                                if (i!==qi) return qq
                                const prevVal = qq.options[oi]?.value || ''
                                const newOptions = qq.options.map((oo,j)=> j===oi? {value:v}:oo)
                                const newCorrect = qq.correct === prevVal ? v : qq.correct
                                return { ...qq, options: newOptions, correct: newCorrect }
                              }))
                            }}
                            className="w-full min-w-0 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white"
                          />
                        </div>
                      ))}
                    </div>
                    <div>
                      <label className="text-white/70 text-sm mb-2 block">الإجابة الصحيحة</label>
                      <select value={String(q.correct || '')} onChange={e=>{
                        const v=e.target.value
                        setQuestions(prev=>prev.map((qq,i)=> i===qi? { ...qq, correct: v }: qq))
                      }} className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white">
                        <option value="">— اختر الإجابة الصحيحة —</option>
                        {q.options.map((op, oi)=> (
                          <option key={oi} value={op.value || ''}>{op.value || `اختيار ${oi+1}`}</option>
                        ))}
                      </select>
                    </div>
                  </>
                )}
                {q.type === 'tf' && (
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">الإجابة الصحيحة</label>
                    <select value={(q.correct ? 'true':'false')} onChange={e=>{
                      const v = e.target.value === 'true'
                      setQuestions(prev=>prev.map((qq,i)=> i===qi? { ...qq, correct: v }: qq))
                    }} className="w-full px-4 py-2 bg-white/10 border border-white/10 rounded-lg text-white">
                      <option value="true">صح</option>
                      <option value="false">خطأ</option>
                    </select>
                  </div>
                )}
                {q.type === 'essay' && (
                  <div>
                    <label className="text-white/70 text-sm mb-2 block">إجابات مقبولة (لن تظهر للطالب)</label>
                    <div className="space-y-2">
                      {(q.acceptable || ['']).map((ans, ai) => (
                        <div key={ai} className="flex gap-2">
                          <input value={ans} onChange={e=>{
                            const v = e.target.value
                            setQuestions(prev=>prev.map((qq,i)=> i===qi? {...qq, acceptable: (qq.acceptable||['']).map((a,j)=> j===ai? v:a)}:qq))
                          }} className="flex-1 px-3 py-2 bg-white/10 border border-white/10 rounded-lg text-white" placeholder={`إجابة ${ai+1}`}/>
                          <button onClick={()=>{
                            setQuestions(prev=>prev.map((qq,i)=> i===qi? {...qq, acceptable: (qq.acceptable||['']).filter((_,j)=> j!==ai)}:qq))
                          }} className="px-3 py-2 bg-white/10 rounded-lg text-white">حذف</button>
                        </div>
                      ))}
                      <button onClick={()=>{
                        setQuestions(prev=>prev.map((qq,i)=> i===qi? {...qq, acceptable: [...(qq.acceptable||[]), '']}:qq))
                      }} className="px-3 py-1.5 bg-white/10 text-white rounded-lg">إضافة إجابة</button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-6">
            <button disabled={loading} onClick={createExam} className="px-6 py-2 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-lg font-bold hover:shadow-lg disabled:opacity-60">إنشاء الامتحان</button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="luxury-card rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">الامتحانات</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-gold border-b border-white/10">
                  <tr>
                    <th className="p-2 text-right">العنوان</th>
                    <th className="p-2">المادة</th>
                    <th className="p-2"><Clock className="inline w-4 h-4"/> الوقت</th>
                    <th className="p-2"><FileText className="inline w-4 h-4"/> الأسئلة</th>
                    <th className="p-2">النشر</th>
                    <th className="p-2">إدارة</th>
                  </tr>
                </thead>
                <tbody>
                  {exams.map((ex:any)=> (
                    <tr key={ex.id} className="border-b border-white/5 hover:bg-white/5">
                      <td className="p-2 text-white">{ex.title}</td>
                      <td className="p-2 text-white/70">{ex.subject_id || '—'}</td>
                      <td className="p-2 text-white/70">{ex.duration_minutes} د</td>
                      <td className="p-2 text-white/70">{ex.questions_count}</td>
                      <td className="p-2">
                        <button onClick={()=>togglePublish(ex)} className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center gap-1">
                          {ex.is_published ? <ToggleRight className="w-4 h-4 text-green-400"/> : <ToggleLeft className="w-4 h-4 text-white/50"/>}
                          <span>{ex.is_published? 'منشور':''}</span>
                        </button>
                      </td>
                      <td className="p-2">
                        <button onClick={()=>loadExamData(ex)} className="px-3 py-1 rounded-lg bg-gold text-black font-bold hover:shadow-lg flex items-center gap-1">
                          <Eye className="w-4 h-4"/> عرض
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {selectedExam && (
            <div className="luxury-card rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">تفاصيل الامتحان: {selectedExam.title}</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-white/80 font-bold mb-2 flex items-center gap-2"><Users className="w-4 h-4"/> من دخل الامتحان</h4>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-gold border-b border-white/10"><tr><th className="p-2 text-right">المستخدم</th><th className="p-2">الوقت</th></tr></thead>
                      <tbody>
                        {entries.map((en:any)=> (
                          <tr key={en.id} className="border-b border-white/5">
                            <td className="p-2 text-white/80">{en.user_id || '—'}</td>
                            <td className="p-2 text-white/60">{new Date(en.started_at).toLocaleString('ar-EG')}</td>
                          </tr>
                        ))}
                        {entries.length===0 && <tr><td className="p-2 text-white/50" colSpan={2}>لا يوجد</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="text-white/80 font-bold mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> النتائج</h4>
                  <div className="max-h-64 overflow-auto">
                    <table className="w-full text-sm">
                      <thead className="text-gold border-b border-white/10">
                        <tr>
                          <th className="p-2 text-right">المستخدم</th>
                          <th className="p-2">الدرجة</th>
                          <th className="p-2">المدة</th>
                          <th className="p-2">الحالة</th>
                          <th className="p-2">التاريخ</th>
                          <th className="p-2">إعادة الامتحان</th>
                          <th className="p-2">تفاصيل</th>
                        </tr>
                      </thead>
                      <tbody>
                        {submissionsWithMeta.map((su:any)=> {
                          const hasViolation = su._hasViolation
                          const statusEl = hasViolation
                            ? <span className="text-red-400">مخالفة</span>
                            : <span className="text-green-400">سليم</span>
                          const canRetry = su.allow_retry === true
                          return (
                            <tr key={su.id} className="border-b border-white/5">
                              <td className="p-2 text-white/80">{su.user_id || '—'}</td>
                              <td className="p-2 text-white/60">{su.score ?? '—'}</td>
                              <td className="p-2 text-white/60">{su.duration_seconds ? Math.round(su.duration_seconds/60)+' د' : '—'}</td>
                              <td className="p-2 text-white/60">{statusEl}</td>
                              <td className="p-2 text-white/60">{new Date(su.created_at).toLocaleString('ar-EG')}</td>
                              <td className="p-2">
                                <button
                                  onClick={async () => {
                                    if (!selectedExam) return
                                    try {
                                      const res = await fetch('/api/admin/exam-retry', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                          userId: su.user_id,
                                          examId: su.exam_id,
                                          allowRetry: !canRetry,
                                        }),
                                      })
                                      const json = await res.json().catch(() => ({} as any))
                                      if (!res.ok || !json?.success) {
                                        throw new Error(json?.error || 'فشل تحديث حالة الامتحان')
                                      }
                                      toast.success(!canRetry ? 'تم السماح للطالب بإعادة الامتحان' : 'تم إلغاء السماح بإعادة الامتحان')
                                      await loadExamData(selectedExam)
                                    } catch (e: any) {
                                      toast.error(e?.message || 'حدث خطأ أثناء تحديث حالة الامتحان')
                                    }
                                  }}
                                  className="px-3 py-1 rounded-lg bg-white/5 text-xs text-white hover:bg-white/15"
                                >
                                  {canRetry ? 'منع الإعادة' : 'السماح بالإعادة'}
                                </button>
                              </td>
                              <td className="p-2">
                                <button
                                  onClick={() => {
                                    setSelectedSubmission(su)
                                    setShowCertificate(false)
                                  }}
                                  className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center gap-1"
                                >
                                  <Eye className="w-4 h-4"/> عرض
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                        {submissionsWithMeta.length===0 && <tr><td className="p-2 text-white/50" colSpan={7}>لا يوجد</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {selectedSubmission && selectedExam && examDetails && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="luxury-card w-full max-w-3xl rounded-2xl p-6 max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">تفاصيل محاولة الامتحان</h3>
              <button
                onClick={() => { setSelectedSubmission(null); setShowCertificate(false) }}
                className="px-3 py-1 rounded-lg bg-white/10 text-white hover:bg-white/20"
              >
                إغلاق
              </button>
            </div>

            <div className="space-y-3 mb-6 text-sm text-white/80">
              <div>الامتحان: <span className="text-white">{selectedExam.title}</span></div>
              <div>المستخدم: <span className="text-white">{selectedSubmission.user_id || '—'}</span></div>
              <div>الدرجة: <span className="text-white">{selectedSubmission.score ?? '—'}</span></div>
              <div>المدة: <span className="text-white">{selectedSubmission.duration_seconds ? Math.round(selectedSubmission.duration_seconds/60)+' د' : '—'}</span></div>
              <div>التاريخ: <span className="text-white">{new Date(selectedSubmission.created_at).toLocaleString('ar-EG')}</span></div>
              <div>الحالة:
                {' '}
                {selectedSubmission._hasViolation
                  ? <span className="text-red-400">تم رصد مخالفة ({selectedSubmission._violationReason || 'بدون سبب مسجل'})</span>
                  : <span className="text-green-400">سليم</span>}
              </div>
              <div>
                نسبة البطارية عند الدخول:
                {' '}
                {selectedSubmission._batteryLevel != null
                  ? <span className="text-white">{selectedSubmission._batteryLevel}%</span>
                  : <span className="text-white/60">غير متوفرة</span>}
              </div>
            </div>

            <div className="space-y-4 mb-6">
              <h4 className="text-white font-bold mb-2">الإجابات</h4>
              {(examDetails.questions || []).map((q: any, idx: number) => {
                const qid = q.id ?? q.qid
                const given = selectedSubmission.answers?.[qid]
                const type = q.type || (Array.isArray(q.options) ? 'mcq' : undefined)
                let isCorrect: boolean | null = null
                let correctLabel = ''
                let givenLabel = given !== undefined && given !== null ? String(given) : '—'

                if (type === 'tf') {
                  const corrBool = typeof q.correct === 'boolean' ? q.correct : String(q.correct).toLowerCase() === 'true'
                  const givenBool = typeof given === 'boolean' ? given : String(given).toLowerCase() === 'true'
                  if (given === undefined || given === null) {
                    isCorrect = null
                  } else {
                    isCorrect = givenBool === corrBool
                  }
                  correctLabel = corrBool ? 'صح' : 'خطأ'
                  givenLabel = given === undefined || given === null ? '—' : (givenBool ? 'صح' : 'خطأ')
                } else if (type === 'essay') {
                  const acc: any[] = Array.isArray(q.acceptable) ? q.acceptable : []
                  if (given === undefined || given === null) {
                    isCorrect = null
                  } else {
                    const gNorm = normalizeAnswer(given)
                    isCorrect = acc.some(a => normalizeAnswer(a) === gNorm)
                  }
                  correctLabel = acc.join(' / ')
                } else {
                  const corr = q.correct
                  if (given === undefined || given === null || corr === undefined || corr === null) {
                    isCorrect = null
                  } else {
                    isCorrect = String(given) === String(corr)
                  }
                  correctLabel = corr !== undefined && corr !== null ? String(corr) : ''
                }

                const statusText = isCorrect === null ? 'لم يُجب' : (isCorrect ? 'صحيح' : 'خطأ')
                const statusColor = isCorrect === null ? 'text-white/60' : (isCorrect ? 'text-green-400' : 'text-red-400')

                return (
                  <div key={qid || idx} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-white font-bold mb-1">س{idx+1}: {q.text}</div>
                    <div className={statusColor}>الحالة: {statusText}</div>
                    <div className="text-white/70 text-sm">إجابة الطالب: <span className="text-white">{givenLabel}</span></div>
                    {correctLabel && (
                      <div className="text-white/70 text-sm">الإجابة الصحيحة: <span className="text-green-300">{correctLabel}</span></div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowCertificate(v => !v)}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold to-yellow-600 text-black font-bold hover:shadow-gold/40 hover:shadow-lg"
              >
                {showCertificate ? 'إخفاء الشهادة' : 'عرض الشهادة'}
              </button>

              {showCertificate && (
                <div className="mt-4 relative mx-auto w-full max-w-4xl rounded-[28px] bg-gradient-to-br from-[#fff9e6] via-[#ffefc2] to-[#facc4d] border border-amber-300/95 shadow-[0_26px_80px_rgba(250,204,21,0.55)] text-slate-900 overflow-hidden">
                  {/* إطار داخلي فاخر وبسيط */}
                  <div className="absolute inset-3 rounded-[24px] border border-amber-300/90 pointer-events-none" />
                  <div className="absolute inset-6 rounded-[20px] border border-amber-200/85 pointer-events-none" />
                  <div className="absolute inset-0 opacity-[0.26] pointer-events-none bg-[radial-gradient(circle_at_top,_rgba(250,204,21,0.9)_0,_transparent_55%),radial-gradient(circle_at_bottom,_rgba(245,158,11,0.85)_0,_transparent_55%)]" />

                  {/* وترمارك فاخر */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-4xl sm:text-6xl font-black tracking-[0.32em] uppercase text-amber-200/55">MOHRAM</div>
                  </div>

                  {/* شريط علوي باسم الأكاديمية */}
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 px-6 sm:px-10 py-1.5 bg-slate-900/95 text-amber-200 text-[11px] sm:text-xs tracking-[0.3em] uppercase rounded-full shadow-[0_10px_30px_rgba(15,23,42,0.7)] flex items-center justify-center gap-2 text-center">
                    <span className="text-sm">✦</span>
                    <span>AHMED MOHRAM ACADEMY</span>
                    <span className="text-sm">✦</span>
                  </div>

                  {/* محتوى الشهادة */}
                  <div className="relative z-10 px-6 sm:px-12 pt-16 pb-10 sm:pt-20 sm:pb-12 space-y-6 sm:space-y-8">
                    {/* رأس الشهادة في المنتصف */}
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 border-[3px] border-white/80 shadow-[0_0_35px_rgba(250,204,21,0.9)] flex items-center justify-center">
                        <span className="text-3xl sm:text-4xl">👑</span>
                      </div>
                      <div className="text-center space-y-1">
                        <div className="text-[11px] sm:text-xs uppercase tracking-[0.35em] text-slate-600">certificate of excellence</div>
                        <div className="text-3xl sm:text-4xl font-extrabold text-slate-900">شهادة تميز استثنائية</div>
                        <div className="text-xs sm:text-sm text-slate-600">تُمنح بكل فخر من</div>
                        <div className="text-lg sm:text-xl font-black text-slate-900">أحمد محرم</div>
                      </div>
                    </div>

                    {/* رقم الشهادة واسم الامتحان */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-[11px] sm:text-xs text-slate-700">
                      <div>
                        رقم الشهادة:
                        <span className="font-semibold"> #{selectedSubmission.id?.slice?.(0, 8) || '—'}</span>
                      </div>
                      <div>
                        الامتحان:
                        <span className="font-semibold"> {selectedExam.title}</span>
                      </div>
                    </div>

                    {/* فقرة تمهيدية */}
                    <div className="text-center text-[11px] sm:text-sm text-slate-700 leading-relaxed max-w-2xl mx-auto">
                      هذه الشهادة الفاخرة تُمنح للطلاب الذين حققوا أداءً مميزاً في امتحانات أحمد محرم، تقديراً لاجتهادهم وتفوقهم المستمر.
                    </div>

                    {/* اسم الطالب والدرجة */}
                    <div className="grid md:grid-cols-2 gap-6 text-sm sm:text-base items-stretch">
                      <div className="space-y-3 text-center md:text-right">
                        <div className="text-slate-700 text-sm sm:text-base">تُمنح هذه الشهادة إلى</div>
                        <div className="text-2xl sm:text-3xl font-bold tracking-wide text-slate-900">
                          {selectedSubmission.user_id || 'الطالب المميز'}
                        </div>
                        <div className="text-slate-700 mt-1 text-sm sm:text-base">تقديراً لاجتيازه بنجاح امتحان</div>
                        <div className="text-lg sm:text-xl font-semibold text-slate-900">
                          {selectedExam.title}
                        </div>
                      </div>
                      <div className="space-y-3 text-center md:text-left">
                        <div className="text-slate-700 text-sm sm:text-base">الدرجة النهائية</div>
                        <div className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-white/85 border border-amber-200 shadow-sm">
                          <span className="text-amber-600 text-xl sm:text-2xl">🏆</span>
                          <span className="text-xl sm:text-2xl font-extrabold text-slate-900">
                            {selectedSubmission.score ?? '—'} / {(examDetails.questions || []).length || '—'}
                          </span>
                        </div>
                        <div className="text-[11px] sm:text-sm text-slate-700 leading-relaxed">
                          هذه الدرجة تعكس مستوى عالياً من التفوق والانضباط، وتضع صاحبها ضمن نخبة المتفوقين على المنصة.
                        </div>
                      </div>
                    </div>

                    {/* التاريخ والتوقيع */}
                    <div className="flex flex-wrap items-center justify-between gap-6 text-[11px] sm:text-sm mt-2 border-t border-amber-200 pt-4">
                      <div className="flex-1 min-w-[140px]">
                        <div className="font-semibold text-slate-800 mb-1">📅 التاريخ</div>
                        <div className="text-slate-700">
                          {new Date(selectedSubmission.created_at).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      <div className="hidden sm:block w-px h-12 bg-amber-200/70" />
                      <div className="flex-1 min-w-[140px] text-center sm:text-right">
                        <div className="font-semibold text-slate-800 mb-1">✍️ التوقيع</div>
                        <div className="text-lg sm:text-xl font-bold text-slate-900">أحمد محرم</div>
                      </div>
                    </div>

                    <div className="mt-2 text-[10px] sm:text-[11px] text-slate-600 text-center leading-relaxed">
                      هذه الشهادة تصدر إلكترونياً من منصة أحمد محرم التعليمية، ويمكن التحقق من صحتها عبر الرجوع إلى سجلات المنصة.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
