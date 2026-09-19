import { Link } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

const QUICK_LINKS = [
  { to: "/admin/students", title: "Học viên", desc: "Xác nhận đăng ký, ghi danh vào lớp, học phí, điểm danh" },
  { to: "/admin/teachers", title: "Giáo viên", desc: "Hồ sơ giáo viên và thời khoá biểu dạy trong tuần" },
  { to: "/admin/courses", title: "Khoá học", desc: "Danh sách khoá học và học phí áp dụng" },
  { to: "/admin/classes", title: "Lớp học", desc: "Lớp học cụ thể thuộc từng khoá" },
  { to: "/admin/materials", title: "Tài liệu", desc: "Đăng tài liệu, bài tập theo từng lớp" },
  { to: "/admin/messages", title: "Nhắn tin", desc: "Trò chuyện trực tiếp với từng học viên" },
];

function greeting() {
  const hour = new Date().getHours();
  if (hour < 11) return "Chào buổi sáng";
  if (hour < 14) return "Chào buổi trưa";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

export default function AdminHome() {
  const { profile } = useAuth();

  return (
    <div>
      <div className="admin-welcome">
        <span className="admin-welcome-eyebrow">{greeting()}</span>
        <h1>{profile?.full_name}</h1>
        <p>Đây là tổng quan khu vực quản lý Anh ngữ Seamark. Chọn 1 mục bên dưới hoặc từ menu bên trái để bắt đầu.</p>
      </div>

      <div className="quick-links">
        {QUICK_LINKS.map((item) => (
          <Link className="quick-link-card" to={item.to} key={item.to}>
            <h3>{item.title}</h3>
            <p>{item.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
