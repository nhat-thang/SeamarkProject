-- =========================================================
-- Anh ngữ Seamark — Database schema (chạy trong Supabase SQL Editor)
-- =========================================================

-- ---------------------------------------------------------
-- 1. Hồ sơ người dùng (mở rộng từ auth.users của Supabase)
-- ---------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'student')),
  full_name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ---------------------------------------------------------
-- 2. Học viên (mỗi học viên = 1 tài khoản đăng nhập)
-- ---------------------------------------------------------
create table public.students (
  id uuid primary key references public.profiles (id) on delete cascade,
  dob date,
  parent_name text,
  parent_phone text,
  campus text,
  status text not null default 'active' check (status in ('active', 'paused', 'inactive')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 3. Giáo viên (chỉ là dữ liệu quản lý, KHÔNG có tài khoản đăng nhập)
-- ---------------------------------------------------------
create table public.teachers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  campus text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 4. Khoá học & lớp học cụ thể
-- ---------------------------------------------------------
create table public.courses (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  age_range text,
  fee_per_month numeric,
  description text,
  created_at timestamptz not null default now()
);

create table public.class_sections (
  id uuid primary key default gen_random_uuid(),
  course_id uuid references public.courses (id) on delete set null,
  name text not null,
  campus text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 5. Lịch giảng dạy (bảng kéo-thả) — giờ tự do, phòng tự do
-- ---------------------------------------------------------
create table public.schedule_slots (
  id uuid primary key default gen_random_uuid(),
  class_section_id uuid not null references public.class_sections (id) on delete cascade,
  teacher_id uuid references public.teachers (id) on delete set null,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Chủ nhật
  start_time time not null,
  end_time time not null,
  room text,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 6. Ghi danh học viên vào lớp
-- ---------------------------------------------------------
create table public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  class_section_id uuid not null references public.class_sections (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'ended')),
  enrolled_at timestamptz not null default now(),
  unique (student_id, class_section_id)
);

-- ---------------------------------------------------------
-- 7. Học phí — ghi nhận chuyển khoản/tiền mặt thủ công
-- ---------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  amount numeric not null,
  payment_date date not null default current_date,
  method text not null default 'chuyen_khoan' check (method in ('chuyen_khoan', 'tien_mat')),
  month_applied text, -- ví dụ '2026-10'
  note text,
  recorded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 8. Điểm danh
-- ---------------------------------------------------------
create table public.attendance (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  schedule_slot_id uuid references public.schedule_slots (id) on delete set null,
  session_date date not null,
  status text not null check (status in ('present', 'absent', 'late')),
  recorded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 9. Tài liệu / bài tập theo lớp
-- ---------------------------------------------------------
create table public.materials (
  id uuid primary key default gen_random_uuid(),
  class_section_id uuid not null references public.class_sections (id) on delete cascade,
  title text not null,
  file_url text not null,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 10. Đăng ký tư vấn từ website công khai (chưa cần đăng nhập)
-- ---------------------------------------------------------
create table public.registration_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  parent_name text,
  phone text not null,
  course_interested text,
  note text,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 11. Nhắn tin: admin gửi tới 1 / nhiều / tất cả học viên
-- ---------------------------------------------------------
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references public.profiles (id),
  body text,
  attachment_url text,
  attachment_type text, -- 'image' | 'file' | null
  created_at timestamptz not null default now()
);

create table public.message_recipients (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz,
  unique (message_id, student_id)
);

-- =========================================================
-- ROW LEVEL SECURITY — chặn học viên xem dữ liệu người khác,
-- chỉ admin mới có toàn quyền quản trị
-- =========================================================

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.teachers enable row level security;
alter table public.courses enable row level security;
alter table public.class_sections enable row level security;
alter table public.schedule_slots enable row level security;
alter table public.enrollments enable row level security;
alter table public.payments enable row level security;
alter table public.attendance enable row level security;
alter table public.materials enable row level security;
alter table public.registration_requests enable row level security;
alter table public.messages enable row level security;
alter table public.message_recipients enable row level security;

-- profiles: xem hồ sơ của chính mình, admin xem tất cả
create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = auth.uid() or public.is_admin());
create policy "profiles_admin_write" on public.profiles
  for all using (public.is_admin()) with check (public.is_admin());

-- students: học viên xem chính mình, admin toàn quyền
create policy "students_select_own_or_admin" on public.students
  for select using (id = auth.uid() or public.is_admin());
create policy "students_admin_write" on public.students
  for all using (public.is_admin()) with check (public.is_admin());

-- teachers / courses / class_sections / schedule_slots:
-- người đã đăng nhập đọc được (để học viên xem lịch/khoá học của mình),
-- chỉ admin được sửa
create policy "teachers_read_authenticated" on public.teachers
  for select using (auth.uid() is not null);
create policy "teachers_admin_write" on public.teachers
  for all using (public.is_admin()) with check (public.is_admin());

create policy "courses_read_authenticated" on public.courses
  for select using (auth.uid() is not null);
create policy "courses_admin_write" on public.courses
  for all using (public.is_admin()) with check (public.is_admin());

create policy "class_sections_read_authenticated" on public.class_sections
  for select using (auth.uid() is not null);
create policy "class_sections_admin_write" on public.class_sections
  for all using (public.is_admin()) with check (public.is_admin());

create policy "schedule_slots_read_authenticated" on public.schedule_slots
  for select using (auth.uid() is not null);
create policy "schedule_slots_admin_write" on public.schedule_slots
  for all using (public.is_admin()) with check (public.is_admin());

-- enrollments: học viên xem lớp của chính mình, admin toàn quyền
create policy "enrollments_select_own_or_admin" on public.enrollments
  for select using (student_id = auth.uid() or public.is_admin());
create policy "enrollments_admin_write" on public.enrollments
  for all using (public.is_admin()) with check (public.is_admin());

-- payments: học viên xem học phí của chính mình, chỉ admin ghi nhận
create policy "payments_select_own_or_admin" on public.payments
  for select using (student_id = auth.uid() or public.is_admin());
create policy "payments_admin_write" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- attendance: học viên xem điểm danh của chính mình, chỉ admin ghi nhận
create policy "attendance_select_own_or_admin" on public.attendance
  for select using (student_id = auth.uid() or public.is_admin());
create policy "attendance_admin_write" on public.attendance
  for all using (public.is_admin()) with check (public.is_admin());

-- materials: học viên xem tài liệu của lớp mình đang học, admin toàn quyền
create policy "materials_select_enrolled_or_admin" on public.materials
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.enrollments e
      where e.class_section_id = materials.class_section_id
        and e.student_id = auth.uid()
    )
  );
create policy "materials_admin_write" on public.materials
  for all using (public.is_admin()) with check (public.is_admin());

-- registration_requests: bất kỳ ai (kể cả khách chưa đăng nhập) đều
-- có thể GỬI đăng ký tư vấn, nhưng chỉ admin mới XEM/SỬA được
create policy "registration_requests_insert_public" on public.registration_requests
  for insert with check (true);
create policy "registration_requests_admin_read_write" on public.registration_requests
  for select using (public.is_admin());
create policy "registration_requests_admin_update" on public.registration_requests
  for update using (public.is_admin()) with check (public.is_admin());

-- messages: chỉ admin được gửi (insert); người nhận xem được tin mình nhận
create policy "messages_admin_insert" on public.messages
  for insert with check (public.is_admin());
create policy "messages_select_admin_or_recipient" on public.messages
  for select using (
    public.is_admin()
    or exists (
      select 1 from public.message_recipients r
      where r.message_id = messages.id and r.student_id = auth.uid()
    )
  );

-- message_recipients: học viên xem dòng của chính mình (đánh dấu đã đọc),
-- admin toàn quyền (để chọn người nhận khi gửi)
create policy "message_recipients_select_own_or_admin" on public.message_recipients
  for select using (student_id = auth.uid() or public.is_admin());
create policy "message_recipients_admin_insert" on public.message_recipients
  for insert with check (public.is_admin());
create policy "message_recipients_update_own_read_status" on public.message_recipients
  for update using (student_id = auth.uid() or public.is_admin())
  with check (student_id = auth.uid() or public.is_admin());

-- =========================================================
-- STORAGE — nơi lưu file đính kèm tin nhắn và tài liệu học tập
-- =========================================================

insert into storage.buckets (id, name, public)
values
  ('materials', 'materials', false),
  ('message-attachments', 'message-attachments', false)
on conflict (id) do nothing;

create policy "materials_bucket_read_authenticated" on storage.objects
  for select using (bucket_id = 'materials' and auth.uid() is not null);
create policy "materials_bucket_admin_write" on storage.objects
  for insert with check (bucket_id = 'materials' and public.is_admin());

create policy "message_attachments_read_authenticated" on storage.objects
  for select using (bucket_id = 'message-attachments' and auth.uid() is not null);
create policy "message_attachments_admin_write" on storage.objects
  for insert with check (bucket_id = 'message-attachments' and public.is_admin());
