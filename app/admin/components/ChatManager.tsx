'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { Send, MessageCircle, Search } from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/components/providers'

export default function ChatManager() {
  const [conversations, setConversations] = useState<any[]>([])
  const [activeUser, setActiveUser] = useState<any | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const [userOnline, setUserOnline] = useState(false)
  const [userTyping, setUserTyping] = useState(false)
  const channelRef = useRef<any>(null)
  const typingTimeoutRef = useRef<any>(null)

  const loadConversations = async () => {
    try {
      const res = await fetch('/api/messages/conversations', { cache: 'no-store' })
      const data = await res.json()
      setConversations(data.conversations || [])
    } catch {}
  }

  const loadMessages = async (userId: string, silent: boolean = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch(`/api/messages?userId=${userId}&markRead=1`, { cache: 'no-store' })
      const data = await res.json()
      setMessages(data.messages || [])
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    } catch {}
    if (!silent) setLoading(false)
  }

  useEffect(() => {
    loadConversations()
    const id = setInterval(loadConversations, 5000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!activeUser) return
    loadMessages(activeUser.user.id, false)
    const id = setInterval(() => loadMessages(activeUser.user.id, true), 3000)
    return () => clearInterval(id)
  }, [activeUser])

  useEffect(() => {
    const userId = activeUser?.user?.id
    if (!userId) {
      setUserOnline(false)
      setUserTyping(false)
      if (channelRef.current) {
        try {
          channelRef.current.send({ type: 'broadcast', event: 'status', payload: { role: 'admin', userId, online: false } })
        } catch {}
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
      return
    }

    const channel = supabase.channel(`support-chat-${userId}`, { config: { broadcast: { self: true } } })
    channelRef.current = channel

    channel
      .on('broadcast', { event: 'status' }, (payload: any) => {
        const data = (payload?.payload || {}) as any
        if (data?.role === 'user' && data?.userId === userId) {
          setUserOnline(!!data.online)
        }
      })
      .on('broadcast', { event: 'typing' }, (payload: any) => {
        const data = (payload?.payload || {}) as any
        if (data?.role === 'user' && data?.userId === userId) {
          setUserTyping(!!data.typing)
        }
      })
      .subscribe((status: any) => {
        if (status === 'SUBSCRIBED') {
          try {
            channel.send({ type: 'broadcast', event: 'status', payload: { role: 'admin', userId, online: true } })
          } catch {}
        }
      })

    return () => {
      setUserOnline(false)
      setUserTyping(false)
      if (channelRef.current) {
        try {
          channelRef.current.send({ type: 'broadcast', event: 'status', payload: { role: 'admin', userId, online: false } })
        } catch {}
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [activeUser])

  const send = async () => {
    const userId = activeUser?.user?.id
    if (!userId || !text.trim()) return
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, sender: 'admin', text })
      })
      if (!res.ok) throw new Error('send failed')
      setText('')
      loadMessages(userId, true)
    } catch {
      toast.error('فشل الإرسال')
    }
  }

  const handleTextChange = (value: string) => {
    setText(value)
    const userId = activeUser?.user?.id
    if (!userId || !channelRef.current) return
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }
    try {
      channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { role: 'admin', userId, typing: true } })
    } catch {}
    typingTimeoutRef.current = setTimeout(() => {
      try {
        if (!channelRef.current) return
        channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { role: 'admin', userId, typing: false } })
      } catch {}
    }, 2000)
  }

  const filtered = conversations.filter(c => !q || c.user.full_name?.toLowerCase().includes(q.toLowerCase()) || c.user.email?.toLowerCase().includes(q.toLowerCase()) || c.user.phone_number?.includes(q))

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="md:col-span-1 luxury-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Search className="w-4 h-4 text-white/50" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث عن مستخدم" className="flex-1 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/40" />
        </div>
        <div className="space-y-2 max-h-[70vh] overflow-auto">
          {filtered.map((c, i) => (
            <button key={i} onClick={() => setActiveUser(c)} className={`w-full text-left p-3 rounded-xl border ${activeUser?.user?.id === c.user.id ? 'border-gold/50 bg-gold/10' : 'border-white/10 hover:bg-white/5'} transition-all`}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-bold text-white">{c.user.full_name || 'مستخدم'}</div>
                  <div className="text-xs text-white/50">{c.user.email || c.user.phone_number}</div>
                </div>
                {c.unread > 0 && <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">{c.unread}</span>}
              </div>
              <div className="text-sm text-white/60 line-clamp-1 mt-1">{c.lastMessage?.text}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="md:col-span-2 luxury-card rounded-2xl p-4 flex flex-col h-[80vh]">
        {!activeUser ? (
          <div className="flex-1 flex flex-col items-center justify-center text-white/50">
            <MessageCircle className="w-10 h-10 mb-2" />
            اختر محادثة
          </div>
        ) : (
          <>
            <div className="mb-3">
              <div className="font-bold text-white">{activeUser.user.full_name || 'مستخدم'} - {activeUser.user.email || activeUser.user.phone_number}</div>
              <div className="text-xs text-white/60 mt-1">
                {userTyping ? 'الطالب يكتب الآن...' : userOnline ? 'متصل الآن' : 'غير متصل حالياً'}
              </div>
            </div>
            <div className="flex-1 overflow-auto space-y-2">
              {loading ? (
                <div className="text-center text-white/50">جاري التحميل...</div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={`max-w-[80%] rounded-2xl px-3 py-2 ${m.sender === 'admin' ? 'ml-auto bg-gold text-black' : 'mr-auto bg-white/10 text-white'}`}>
                    <div className="text-sm whitespace-pre-wrap">{m.text}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">
                      {new Date(m.created_at).toLocaleString('ar-EG')}
                      {' '}
                      {m.sender === 'admin' ? (m.read_by_user ? 'شوهد' : 'لم يُقرأ بعد') : (m.read_by_admin ? 'مقروء' : 'غير مقروء')}
                    </div>
                  </div>
                ))
              )}
              <div ref={bottomRef} />
            </div>
            <div className="mt-3 flex items-center gap-2">
              <input value={text} onChange={e => handleTextChange(e.target.value)} onKeyDown={e => e.key==='Enter' && send()} placeholder="اكتب رسالة..." className="flex-1 px-3 py-3 bg-white/5 border border-white/10 rounded-xl text-white" />
              <button onClick={send} className="px-4 py-3 bg-gradient-to-r from-gold to-yellow-600 text-black rounded-xl font-bold flex items-center gap-2"><Send className="w-4 h-4" /> إرسال</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
