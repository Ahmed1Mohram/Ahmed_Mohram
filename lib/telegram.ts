import { supabaseAdmin } from './db-client'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || ''
const API_BASE = BOT_TOKEN ? `https://api.telegram.org/bot${BOT_TOKEN}` : ''

export async function ensureTelegramTables() {
  try {
    const sql = `
      create table if not exists telegram_subscribers (
        id bigserial primary key,
        user_id uuid,
        chat_id bigint unique,
        username text,
        subscribed boolean default true,
        created_at timestamptz default now()
      );
      create table if not exists notification_templates (
        key text primary key,
        template text
      );
    `
    try {
      await supabaseAdmin.rpc('exec', { sql })
    } catch {}
  } catch {}
}

export async function telegramSendMessage(chatId: number, text: string) {
  if (!API_BASE) return { ok: false, error: 'BOT_TOKEN_MISSING' }
  const res = await fetch(`${API_BASE}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true })
  })
  try { return await res.json() } catch { return { ok: false } }
}

export async function getAllSubscribers(): Promise<number[]> {
  const list: number[] = []
  const envChat = process.env.TELEGRAM_CHAT_ID
  if (envChat && /^-?\d+$/.test(envChat)) list.push(Number(envChat))
  try {
    const { data } = await supabaseAdmin.from('telegram_subscribers').select('chat_id').eq('subscribed', true)
    for (const r of (data || [])) list.push(Number(r.chat_id))
  } catch {}
  // إزالة التكرارات
  return Array.from(new Set(list))
}

export async function telegramBroadcast(text: string) {
  if (!text) return { ok: false, error: 'EMPTY_TEXT' }
  const chatIds = await getAllSubscribers()
  const results = await Promise.all(chatIds.map(id => telegramSendMessage(id, text)))
  const success = results.filter(r => r && r.ok).length
  return { ok: true, total: chatIds.length, success }
}

export async function upsertSubscriber(chatId: number, username?: string, userId?: string) {
  await ensureTelegramTables()
  await supabaseAdmin.from('telegram_subscribers').upsert({ chat_id: chatId, username, user_id: userId, subscribed: true }, { onConflict: 'chat_id' })
}

export async function setSubscription(chatId: number, on: boolean) {
  await ensureTelegramTables()
  await supabaseAdmin.from('telegram_subscribers').update({ subscribed: on }).eq('chat_id', chatId)
}

export async function getTemplate(key: string): Promise<string> {
  await ensureTelegramTables()
  const { data } = await supabaseAdmin.from('notification_templates').select('template').eq('key', key).maybeSingle()
  return data?.template || defaultTemplates[key] || ''
}

export const defaultTemplates: Record<string, string> = {
  subject_created: 'تم إضافة مادة جديدة: {{title}}',
  lecture_created: 'تم إضافة محاضرة جديدة: {{title}} ضمن مادة {{subject}}',
  content_created: 'تم إضافة محتوى جديد ({{type}}): {{title}} ضمن محاضرة {{lecture}}',
  broadcast: '{{text}}'
}

export function renderTemplate(tpl: string, data: Record<string, any>) {
  return tpl.replace(/{{\s*(\w+)\s*}}/g, (_, k) => (data?.[k] ?? '').toString())
}
