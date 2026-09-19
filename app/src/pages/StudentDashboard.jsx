import { useAuth } from "../lib/AuthContext";

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <div>
          <strong>Khu vực Học viên</strong>
          <span>Xin chào, {profile?.full_name}</span>
        </div>
        <button onClick={signOut}>Đăng xuất</button>
      </header>

      <main className="dashboard-body">
        <p>
          Đây là khung học viên — kết nối Supabase và đăng nhập đã hoạt động.
          Các mục thời khoá biểu, học phí, tài liệu và điểm danh sẽ được thêm
          ở các bước tiếp theo.
        </p>
      </main>
    </div>
  );
}
