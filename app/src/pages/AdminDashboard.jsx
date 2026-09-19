import { useAuth } from "../lib/AuthContext";

export default function AdminDashboard() {
  const { profile, signOut } = useAuth();

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <div>
          <strong>Khu vực Quản lý (Admin)</strong>
          <span>Xin chào, {profile?.full_name}</span>
        </div>
        <button onClick={signOut}>Đăng xuất</button>
      </header>

      <main className="dashboard-body">
        <p>
          Đây là khung admin — kết nối Supabase và đăng nhập đã hoạt động.
          Các màn hình quản lý học viên, giáo viên, lịch giảng dạy (kéo-thả),
          học phí, điểm danh và nhắn tin sẽ được thêm ở các bước tiếp theo.
        </p>
      </main>
    </div>
  );
}
