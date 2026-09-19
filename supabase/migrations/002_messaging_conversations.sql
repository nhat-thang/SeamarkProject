-- =========================================================
-- Nâng cấp Nhắn tin: chuyển từ "gửi 1 chiều, chọn nhiều người
-- nhận" sang "hội thoại 2 chiều kiểu Messenger" — mỗi học viên
-- có 1 luồng chat riêng với trung tâm, học viên trả lời được.
--
-- Chạy 1 lần trong Supabase SQL Editor trên project đang chạy
-- thật (khác với schema.sql chỉ dùng cho lần tạo mới đầu tiên).
-- Xoá sạch dữ liệu tin nhắn cũ (chấp nhận được vì đang ở giai
-- đoạn demo/test).
-- =========================================================

drop policy if exists "messages_admin_insert" on public.messages;
drop policy if exists "messages_select_admin_or_recipient" on public.messages;
drop policy if exists "message_recipients_select_own_or_admin" on public.message_recipients;
drop policy if exists "message_recipients_admin_insert" on public.message_recipients;
drop policy if exists "message_recipients_update_own_read_status" on public.message_recipients;

drop table if exists public.message_recipients;
drop table if exists public.messages;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students (id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.conversation_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sender_id uuid not null references public.profiles (id),
  sender_role text not null check (sender_role in ('admin', 'student')),
  body text,
  attachment_url text,
  attachment_type text,
  read_by_admin boolean not null default false,
  read_by_student boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.conversations enable row level security;
alter table public.conversation_messages enable row level security;

create policy "conversations_select_own_or_admin" on public.conversations
  for select using (student_id = auth.uid() or public.is_admin());
create policy "conversations_insert_own_or_admin" on public.conversations
  for insert with check (student_id = auth.uid() or public.is_admin());

create policy "conversation_messages_select_own_or_admin" on public.conversation_messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and c.student_id = auth.uid()
    )
  );

create policy "conversation_messages_insert" on public.conversation_messages
  for insert with check (
    sender_id = auth.uid()
    and sender_role = (case when public.is_admin() then 'admin' else 'student' end)
    and (
      public.is_admin()
      or exists (
        select 1 from public.conversations c
        where c.id = conversation_messages.conversation_id and c.student_id = auth.uid()
      )
    )
  );

create policy "conversation_messages_update_read_status" on public.conversation_messages
  for update using (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and c.student_id = auth.uid()
    )
  )
  with check (
    public.is_admin()
    or exists (
      select 1 from public.conversations c
      where c.id = conversation_messages.conversation_id and c.student_id = auth.uid()
    )
  );

drop policy if exists "message_attachments_admin_write" on storage.objects;
create policy "message_attachments_authenticated_write" on storage.objects
  for insert with check (bucket_id = 'message-attachments' and auth.uid() is not null);
