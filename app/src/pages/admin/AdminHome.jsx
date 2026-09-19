import ChangePasswordForm from "../../components/ChangePasswordForm";

export default function AdminHome() {
  return (
    <div>
      <div className="page-head">
        <h1>Tổng quan</h1>
      </div>
      <p className="empty-note">
        Bắt đầu từ menu bên trái: thêm giáo viên, khoá học, lớp học — sau đó
        vào hồ sơ từng giáo viên để xếp thời khoá biểu dạy trong tuần.
      </p>

      <h2 style={{ fontSize: "1.05rem", color: "var(--navy)" }}>Đổi mật khẩu</h2>
      <ChangePasswordForm />
    </div>
  );
}
