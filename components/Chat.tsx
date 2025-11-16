'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, Send, X, Minimize2, Maximize2, 
  Paperclip, Smile, MoreVertical, Phone, Video 
} from 'lucide-react'
import toast from 'react-hot-toast'
import { supabase } from '@/components/providers'

 

interface Message {
  id: string
  sender_id: string
  receiver_id: string
  message_text: string
  created_at: string
  is_read: boolean
  sender?: {
    full_name: string
    avatar_url?: string
  }
}

interface ChatProps {
  userId: string
  isAdmin?: boolean
  receiverId?: string
}

export default function Chat({ userId, isAdmin = false, receiverId }: ChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [typing, setTyping] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen && !isMinimized) {
      fetchMessages()
      const subscription = subscribeToMessages()
      
      return () => {
        subscription?.unsubscribe()
      }
    }
  }, [isOpen, isMinimized])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:sender_id(full_name, avatar_url)
        `)
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
      toast.error('فشل جلب الرسائل')
    } finally {
      setLoading(false)
    }
  }

  const subscribeToMessages = () => {
    return supabase
      .channel('messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `or(sender_id=eq.${userId},receiver_id=eq.${userId})`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    try {
      const messageData = {
        sender_id: userId,
        receiver_id: receiverId || (isAdmin ? null : 'admin-id'), // في حالة الطالب يرسل للأدمن
        message_text: newMessage.trim(),
        is_read: false,
        created_at: new Date().toISOString()
      }

      const { error } = await supabase
        .from('messages')
        .insert(messageData)

      if (error) throw error

      setNewMessage('')
      inputRef.current?.focus()
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('فشل إرسال الرسالة')
    }
  }

  const markAsRead = async (messageId: string) => {
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .eq('receiver_id', userId)
  }

  return (
    <>
      {/* Chat Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-40 w-14 h-14 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center shadow-xl hover:shadow-gold-glow transition-all"
          >
            <MessageCircle className="w-6 h-6 text-black" />
            {messages.filter(m => !m.is_read && m.receiver_id === userId).length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className={`fixed z-50 ${
              isMinimized 
                ? 'bottom-6 right-6 w-80 h-14' 
                : 'bottom-6 right-6 w-96 h-[600px] max-h-[80vh]'
            } luxury-card rounded-2xl shadow-2xl flex flex-col overflow-hidden`}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-gold/20 to-purple-600/20 p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-gold to-yellow-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">
                      {isAdmin ? 'رسائل الطلاب' : 'الدعم الفني'}
                    </h3>
                    {typing && (
                      <p className="text-xs text-green-400">يكتب...</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMinimized(!isMinimized)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="text-center py-8">
                      <MessageCircle className="w-12 h-12 text-white/20 mx-auto mb-2" />
                      <p className="text-white/40 text-sm">لا توجد رسائل بعد</p>
                      <p className="text-white/30 text-xs">ابدأ المحادثة الآن!</p>
                    </div>
                  ) : (
                    messages.map((message) => {
                      const isMe = message.sender_id === userId
                      
                      return (
                        <motion.div
                          key={message.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                          onViewportEnter={() => {
                            if (!isMe && !message.is_read) {
                              markAsRead(message.id)
                            }
                          }}
                        >
                          <div className={`max-w-[70%] ${
                            isMe 
                              ? 'bg-gradient-to-br from-gold/20 to-yellow-600/20' 
                              : 'bg-white/10'
                          } rounded-2xl px-4 py-2`}>
                            {!isMe && (
                              <p className="text-xs text-gold mb-1 font-semibold">
                                {message.sender?.full_name || 'مستخدم'}
                              </p>
                            )}
                            <p className="text-white text-sm">{message.message_text}</p>
                            <p className="text-white/40 text-xs mt-1">
                              {new Date(message.created_at).toLocaleTimeString('ar-EG', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          </div>
                        </motion.div>
                      )
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <form onSubmit={sendMessage} className="p-4 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Paperclip className="w-5 h-5 text-white/50" />
                    </button>
                    
                    <input
                      ref={inputRef}
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onFocus={() => setTyping(true)}
                      onBlur={() => setTyping(false)}
                      placeholder="اكتب رسالتك..."
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white placeholder-white/30 focus:outline-none focus:border-gold/50 transition-all"
                    />
                    
                    <button
                      type="button"
                      className="p-2 hover:bg-white/10 rounded-lg transition-all"
                    >
                      <Smile className="w-5 h-5 text-white/50" />
                    </button>
                    
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className="p-2 bg-gradient-to-br from-gold to-yellow-600 rounded-lg hover:shadow-gold-glow transition-all disabled:opacity-50"
                    >
                      <Send className="w-5 h-5 text-black" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
