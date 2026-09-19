import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";

export default function AdminLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="admin-shell">
      <header className="dashboard-header">
        <div>
          <strong>Khu vực Quản lý (Admin)</strong>
          <span>Xin chào, {profile?.full_name}</span>
        </div>
        <button onClick={signOut}>Đăng xuất</button>
      </header>

      <div className="admin-body">
        <nav className="admin-sidebar">
          <NavLink to="/admin" end>Tổng quan</NavLink>
          <NavLink to="/admin/students">Học viên</NavLink>
          <NavLink to="/admin/teachers">Giáo viên</NavLink>
          <NavLink to="/admin/courses">Khoá học</NavLink>
          <NavLink to="/admin/classes">Lớp học</NavLink>
          <NavLink to="/admin/materials">Tài liệu</NavLink>
          <NavLink to="/admin/messages">Nhắn tin</NavLink>
        </nav>

        <div className="admin-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
