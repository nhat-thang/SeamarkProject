# Tiến độ dự án — Website Anh ngữ Seamark

Repo GitHub: https://github.com/nhat-thang/SeamarkProject

## Cách chạy thử ở máy này

1. **Trang giới thiệu công khai (tĩnh):** mở terminal tại thư mục gốc dự án, chạy:
   ```
   python -m http.server 8000
   ```
   rồi mở http://localhost:8000

2. **Ứng dụng quản lý (admin) / học viên:**
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

## Đang làm / sắp tới

- [ ] Các trang tĩnh còn lại của site công khai: Khoá học, Đội ngũ giáo viên, Học phí, Đánh giá, FAQ, Liên hệ, Đăng nhập (nav đang trỏ tới nhưng các file này chưa được tạo)
- [x] Admin: ghi danh học viên vào lớp học cụ thể (trong trang Học viên, cột "Lớp đang học")
- [ ] "Quên mật khẩu" / admin cấp lại mật khẩu cho học viên
- [ ] Admin: nhắn tin tới học viên — chọn 1 người / nhiều người / tất cả, gửi kèm text, file hoặc ảnh
- [ ] Admin: ghi nhận học phí (chuyển khoản/tiền mặt thủ công) + điểm danh
- [ ] Học viên: xem thời khoá biểu cá nhân, tình trạng học phí, tài liệu/bài tập, điểm danh, hộp thư
- [ ] Nối trang công khai và app quản lý lại thành 1 trải nghiệm liền mạch (nút "Đăng nhập" trỏ đúng sang app)
- [ ] Triển khai demo: trang công khai lên Netlify, backend/app quản lý lên Render hoặc Railway khi cần
- [ ] Mua domain thật (.vn hoặc .com) khi ra mắt chính thức

## Thông tin đang dùng tạm — cần chốt lại trước khi ra mắt thật

- Số điện thoại / Zalo hiển thị trên web: `0123.456.789` (placeholder)

## Quyết định kỹ thuật đã chốt

- Trang công khai: HTML/CSS/JS thuần (không dùng framework)
- Admin + học viên: React (Vite) + Supabase (Postgres + Auth), lý do: quy mô nhỏ, viết ít code backend nhất, có sẵn xác thực đăng nhập
- Lịch giảng dạy: không dùng kéo-thả; mỗi giáo viên có 1 thời khoá biểu tuần riêng, giờ học và phòng học nhập tự do (chưa cố định ca/phòng)
- Học phí giai đoạn đầu: chỉ ghi nhận chuyển khoản/tiền mặt thủ công, chưa tích hợp cổng thanh toán online
