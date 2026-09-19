# Tiến độ dự án — Website Anh ngữ Seamark

Repo GitHub: https://github.com/nhat-thang/SeamarkProject

## Cách chạy thử ở máy này

1. **Trang giới thiệu công khai (tĩnh):** mở terminal tại thư mục gốc dự án, chạy:
   ```
   python -m http.server 8000
   ```
   rồi mở http://localhost:8000

2. **Bắt buộc nếu đã tạo project Supabase trước ngày nâng cấp nhắn tin 2 chiều:** chạy file `supabase/migrations/002_messaging_conversations.sql` trong SQL Editor 1 lần — thay bảng nhắn tin cũ (gửi 1 chiều) bằng bảng hội thoại 2 chiều mới. Sau khi chạy, dữ liệu tin nhắn cũ (nếu có) sẽ mất — chấp nhận được vì đang ở giai đoạn demo.

3. **(Tuỳ chọn) Dữ liệu demo để test nhanh:** chạy `supabase/seed_demo.sql` trong Supabase SQL Editor — tạo sẵn 3 khoá học, 3 giáo viên, 3 lớp học kèm lịch dạy, để có ngay dữ liệu ghi danh/điểm danh/thời khoá biểu mà không cần tạo tay.

4. **Ứng dụng quản lý (admin) / học viên:**
   ```
   cd app
   npm run dev
   ```
   rồi mở http://localhost:5173
   - Cần có file `app/.env` chứa `VITE_SUPABASE_URL` và `VITE_SUPABASE_ANON_KEY` (đã tạo sẵn trên máy này, **không** đẩy lên GitHub vì lý do bảo mật — nếu đổi máy khác cần tạo lại file này, xem mẫu ở `app/.env.example`)

Đây là **2 ứng dụng tách biệt**, chạy 2 server cục bộ song song — trang chủ tĩnh chưa nối được sang app quản lý (xem mục "Đang làm / sắp tới").

## Đã hoàn thành

- [x] Trang chủ tĩnh: hero, vì sao chọn Seamark, chatbot spotlight, khoá học nổi bật, đánh giá phụ huynh, CTA, footer
- [x] Chatbot tư vấn demo (kịch bản dựng sẵn, JS thuần) + bong bóng gọi nhanh & Zalo
- [x] Database schema Supabase (`supabase/schema.sql`): 13 bảng — học viên, giáo viên, khoá học, lớp học, lịch giảng dạy, ghi danh, học phí, điểm danh, tài liệu, đăng ký tư vấn, nhắn tin — kèm phân quyền (RLS) để học viên chỉ xem được dữ liệu của chính mình
- [x] Đăng nhập thật qua Supabase Auth, tự động chuyển hướng vào khu vực Admin hoặc Học viên theo vai trò
- [x] Admin: quản lý Giáo viên (thêm/sửa/xoá)
- [x] Admin: quản lý Khoá học (thêm/sửa/xoá)
- [x] Admin: quản lý Lớp học, gắn với khoá học (thêm/sửa/xoá)
- [x] Admin: thời khoá biểu theo tuần cho từng giáo viên — thêm buổi dạy (chọn lớp, giờ, phòng), tự động cảnh báo nếu trùng giờ
- [x] Admin: danh sách đăng ký tư vấn (chờ xác nhận) → xác nhận → tự tạo tài khoản học viên qua Supabase Edge Function (`create-student-account`), có nút thêm học viên thủ công (khách đăng ký ngoài đời/qua điện thoại)
- [x] Admin: ghi danh học viên vào lớp học cụ thể (trong trang Học viên, cột "Lớp đang học")
- [x] Học viên: giao diện xem thời khoá biểu cá nhân, tình trạng học phí, tài liệu/bài tập, điểm danh, hộp thư — tất cả đều đọc dữ liệu thật
- [x] Admin: ghi nhận học phí (chuyển khoản/tiền mặt thủ công) + điểm danh, theo từng học viên (trang "Học phí/Điểm danh")
- [x] Admin: đăng tài liệu/bài tập theo lớp (upload file lên Supabase Storage, học viên tải xuống bằng link có hạn dùng)
- [x] Nhắn tin 2 chiều kiểu Messenger: mỗi học viên có 1 luồng chat riêng với trung tâm, học viên trả lời được (text + ảnh/file). Admin có thêm nút "Soạn tin gửi nhiều học viên" để gửi 1 nội dung tới nhiều/tất cả học viên cùng lúc.

**→ Toàn bộ chức năng cốt lõi trong bản kế hoạch backend ban đầu đã xong.** Phần còn lại là hoàn thiện trải nghiệm và triển khai thật.

- [x] Tự đổi mật khẩu (cả admin và học viên) trong tab "Tài khoản"/"Tổng quan"
- [x] Admin cấp lại mật khẩu học viên khi quên hẳn (Edge Function `reset-student-password`, mật khẩu mới hiện 1 lần cho admin gửi lại)
- [x] Tự đổi tên hiển thị (cả admin và học viên) trong trang/tab "Tài khoản" — có vá lỗ hổng RLS: chặn tự đổi cột `role` để không ai tự nâng quyền thành admin

- [x] 7 trang tĩnh còn lại của site công khai: `khoa-hoc.html` (chi tiết 4 khoá), `giao-vien.html` (6 giáo viên demo), `hoc-phi.html` (bảng giá), `danh-gia.html` (6 đánh giá), `faq.html` (accordion 9 câu hỏi), `lien-he.html`, `dang-nhap.html`
- [x] `lien-he.html` **đã nối thật với Supabase**: form đăng ký tư vấn ghi thẳng vào bảng `registration_requests` mà admin đang xem trong app — không cần đăng nhập (dùng `@supabase/supabase-js` qua CDN + anon key, không qua React app)

## Đang làm / sắp tới

- [ ] Nối trang công khai và app quản lý lại thành 1 trải nghiệm liền mạch — hiện `dang-nhap.html` đang trỏ tạm sang `http://localhost:5173` (ghi rõ trong file, cần đổi khi có domain thật)
- [ ] Triển khai demo: trang công khai lên Netlify, backend/app quản lý lên Render hoặc Railway khi cần
- [ ] Mua domain thật (.vn hoặc .com) khi ra mắt chính thức

## Thông tin đang dùng tạm — cần chốt lại trước khi ra mắt thật

- Số điện thoại / Zalo hiển thị trên web: `0123.456.789` (placeholder)

## Quyết định kỹ thuật đã chốt

- Trang công khai: HTML/CSS/JS thuần (không dùng framework)
- Admin + học viên: React (Vite) + Supabase (Postgres + Auth), lý do: quy mô nhỏ, viết ít code backend nhất, có sẵn xác thực đăng nhập
- Lịch giảng dạy: không dùng kéo-thả; mỗi giáo viên có 1 thời khoá biểu tuần riêng, giờ học và phòng học nhập tự do (chưa cố định ca/phòng)
- Học phí giai đoạn đầu: chỉ ghi nhận chuyển khoản/tiền mặt thủ công, chưa tích hợp cổng thanh toán online
