-- =========================================================
-- Dữ liệu DEMO — chạy trong Supabase SQL Editor để có sẵn
-- khoá học / lớp học / giáo viên / lịch dạy mà test điểm danh,
-- học phí, thời khoá biểu học viên. Chạy lại nhiều lần vẫn an
-- toàn (không tạo trùng) nhờ ON CONFLICT DO NOTHING.
-- =========================================================

-- ---------- Khoá học ----------
insert into public.courses (id, name, age_range, fee_per_month, description) values
  ('11111111-1111-1111-1111-111111111111', 'Anh ngữ Thiếu nhi', '6 - 11 tuổi', 1500000, 'Xây nền tảng phát âm và phản xạ giao tiếp qua trò chơi'),
  ('22222222-2222-2222-2222-222222222222', 'Anh ngữ Thiếu niên', '12 - 15 tuổi', 1900000, 'Luyện đều 4 kỹ năng, chuẩn bị chứng chỉ quốc tế'),
  ('33333333-3333-3333-3333-333333333333', 'IELTS Foundation', 'Luyện thi', 2800000, 'Lộ trình cá nhân hoá theo band điểm mục tiêu')
on conflict (id) do nothing;

-- ---------- Giáo viên ----------
insert into public.teachers (id, full_name, phone, email, campus) values
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Nguyễn Thị Hoa', '0900000001', 'hoa.nguyen@seamark.demo', 'CS1 - TP Vinh'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Trần Văn Long', '0900000002', 'long.tran@seamark.demo', 'CS1 - TP Vinh'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Lê Minh Anh', '0900000003', 'anh.le@seamark.demo', 'CS2 - Cầu Giát')
on conflict (id) do nothing;

-- ---------- Lớp học ----------
insert into public.class_sections (id, course_id, name, campus) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '11111111-1111-1111-1111-111111111111', 'Thiếu nhi sáng T2-4-6', 'CS1 - TP Vinh'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '22222222-2222-2222-2222-222222222222', 'Thiếu niên tối T3-5-7', 'CS1 - TP Vinh'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', '33333333-3333-3333-3333-333333333333', 'IELTS tối cuối tuần', 'CS2 - Cầu Giát')
on conflict (id) do nothing;

-- ---------- Lịch giảng dạy ----------
-- day_of_week: 0 = Chủ nhật, 1 = Thứ 2, ... 6 = Thứ 7 (giống bảng trong app)
insert into public.schedule_slots (class_section_id, teacher_id, day_of_week, start_time, end_time, room) values
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 1, '08:00', '09:30', 'P101'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 3, '08:00', '09:30', 'P101'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 5, '08:00', '09:30', 'P101'),

  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 2, '19:00', '20:30', 'P102'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 4, '19:00', '20:30', 'P102'),
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 6, '19:00', '20:30', 'P102'),

  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 6, '20:45', '22:15', 'P201'),
  ('ffffffff-ffff-ffff-ffff-ffffffffffff', 'cccccccc-cccc-cccc-cccc-cccccccccccc', 0, '08:00', '09:30', 'P201');
