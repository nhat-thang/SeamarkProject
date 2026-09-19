# Anh ngữ Seamark — Website & Hệ thống quản lý

Website cho Trung tâm Anh ngữ Seamark (TP Vinh & Cầu Giát, Nghệ An): trang giới thiệu công khai kèm chatbot tư vấn, và hệ thống quản lý/học viên chạy trên Supabase.

## Cấu trúc dự án

Dự án gồm **2 phần độc lập**, chạy như 2 site riêng biệt:

```
prj-seamark/
├── index.html, khoa-hoc.html, ...   # Trang công khai — HTML/CSS/JS thuần
├── assets/                          # CSS, JS, ảnh của trang công khai
├── app/                             # Ứng dụng quản lý (Admin) + Học viên — React (Vite)
└── supabase/
    ├── schema.sql                   # Toàn bộ schema database (dùng khi tạo project Supabase mới)
    ├── seed_demo.sql                # Dữ liệu mẫu để test nhanh (tuỳ chọn)
    ├── migrations/                  # Các bản cập nhật schema cho project đang chạy thật
    └── functions/                   # Supabase Edge Functions (tạo tài khoản, cấp lại mật khẩu)
```

## Công nghệ sử dụng

- **Trang công khai:** HTML/CSS/JS thuần — không cần build, không cần cài đặt.
- **App quản lý/học viên:** React (Vite) + [Supabase](https://supabase.com) (Postgres, Auth, Storage, Edge Functions) làm backend.
- Cả 2 phần đều gọi thẳng tới cùng 1 project Supabase.

## Chạy thử ở máy local

### 1. Trang công khai

```
python -m http.server 8000
```

Mở http://localhost:8000

### 2. App quản lý / học viên

```
cd app
npm install
npm run dev
```

Mở http://localhost:5173. Cần tạo file `app/.env` (không commit lên Git) theo mẫu `app/.env.example`:

```
VITE_SUPABASE_URL=<url project Supabase của bạn>
VITE_SUPABASE_ANON_KEY=<anon public key>
```

### 3. Thiết lập Supabase (lần đầu)

1. Tạo project mới tại [supabase.com](https://supabase.com).
2. Vào **SQL Editor**, chạy `supabase/schema.sql`.
3. (Tuỳ chọn) Chạy `supabase/seed_demo.sql` để có sẵn dữ liệu mẫu.
4. Tạo tài khoản admin đầu tiên: **Authentication → Add user**, sau đó thêm 1 dòng tương ứng vào bảng `profiles` với `role = admin`.
5. Deploy 2 Edge Function bằng Supabase CLI:
   ```
   npx supabase login
   npx supabase link --project-ref <project-ref-của-bạn>
   npx supabase functions deploy create-student-account --no-verify-jwt
   npx supabase functions deploy reset-student-password --no-verify-jwt
   ```

Nếu project Supabase được tạo **trước** khi tính năng nhắn tin 2 chiều hoặc tự sửa hồ sơ ra đời, cần chạy thêm các file trong `supabase/migrations/` theo đúng thứ tự số.

## Tính năng chính

**Trang công khai:** giới thiệu trung tâm, khoá học, đội ngũ giáo viên, học phí, đánh giá phụ huynh, FAQ, chatbot tư vấn (kịch bản dựng sẵn), form đăng ký tư vấn (ghi thẳng vào Supabase).

**Admin:** quản lý giáo viên/khoá học/lớp học, xếp thời khoá biểu theo tuần, xác nhận đăng ký tư vấn và tạo tài khoản học viên, ghi danh vào lớp, ghi nhận học phí/điểm danh, đăng tài liệu, nhắn tin 2 chiều với học viên.

**Học viên:** xem thời khoá biểu, học phí, tài liệu, điểm danh, nhắn tin với trung tâm, tự đổi tên/mật khẩu.

## Tiến độ & việc còn lại

Xem chi tiết tại [TIEN-DO.md](TIEN-DO.md) — theo dõi từng hạng mục đã xong/đang làm, quyết định kỹ thuật đã chốt, và thông tin placeholder cần cập nhật trước khi ra mắt chính thức.
