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
    try {
      const [entriesRes, subsRes] = await Promise.all([
        fetch(`/api/exam-entries?examId=${exam.id}`),
        fetch(`/api/submit-exam?examId=${exam.id}`),
      ])
      const entriesJson = await entriesRes.json()
      const subsJson = await subsRes.json()
      setEntries(entriesJson.entries || [])
      setSubmissions(subsJson.submissions || [])
    } catch {}
  }

  const addQuestion = () => {
    const idx = questions.length + 1
    setQuestions(prev => [...prev, { id: `q${idx}`, text: '', type: 'mcq', options: [{ value: '' }, { value: '' }, { value: '' }, { value: '' }], correct: '' }])
  }

  const totalQuestions = useMemo(() => questions.length, [questions])

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
                      <thead className="text-gold border-b border-white/10"><tr><th className="p-2 text-right">المستخدم</th><th className="p-2">الدرجة</th><th className="p-2">المدة</th><th className="p-2">التاريخ</th></tr></thead>
                      <tbody>
                        {submissions.map((su:any)=> (
                          <tr key={su.id} className="border-b border-white/5">
                            <td className="p-2 text-white/80">{su.user_id || '—'}</td>
                            <td className="p-2 text-white/60">{su.score ?? '—'}</td>
                            <td className="p-2 text-white/60">{su.duration_seconds ? Math.round(su.duration_seconds/60)+' د' : '—'}</td>
                            <td className="p-2 text-white/60">{new Date(su.created_at).toLocaleString('ar-EG')}</td>
                          </tr>
                        ))}
                        {submissions.length===0 && <tr><td className="p-2 text-white/50" colSpan={4}>لا يوجد</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
