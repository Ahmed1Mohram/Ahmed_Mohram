import { supabaseAdmin } from './db-client'

export async function ensureMessagesTable() {
  // نضمن أن جدول messages الحالي يحتوي أعمدة الشات بين الطالب والإدارة
  // بدون تغيير الأعمدة القديمة المستخدمة في شات المحاضرات
  const sql = `
    alter table if exists public.messages
      add column if not exists user_id uuid,
      add column if not exists sender text check (sender in ('admin','user')),
      add column if not exists text text,
      add column if not exists read_by_admin boolean default false,
      add column if not exists read_by_user boolean default false;

    -- السماح بأن يكون العمود القديم message_text فارغًا حتى لا يفشل الإدراج من الـ API الجديد
    do $$
    begin
      if exists (
        select 1 from information_schema.columns
        where table_name = 'messages' and column_name = 'message_text'
      ) then
        alter table public.messages alter column message_text drop not null;
      end if;
    end $$;

    -- إجبار PostgREST على إعادة تحميل المخطط لالتقاط الأعمدة الجديدة والتعديلات
    notify pgrst, 'reload schema';
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
