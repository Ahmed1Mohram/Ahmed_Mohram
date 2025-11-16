import { supabaseAdmin } from './db-client'

export async function ensureMessagesTable() {
  const sql = `
    create table if not exists messages (
      id bigserial primary key,
      user_id uuid not null,
      sender text not null check (sender in ('admin','user')),
      text text not null,
      created_at timestamptz default now(),
      read_by_admin boolean default false,
      read_by_user boolean default false
    );
  `
  try { await supabaseAdmin.rpc('exec', { sql }) } catch {}
}

export interface MessageRow {
  id: number
  user_id: string
  sender: 'admin'|'user'
  text: string
  created_at: string
  read_by_admin: boolean
  read_by_user: boolean
}
