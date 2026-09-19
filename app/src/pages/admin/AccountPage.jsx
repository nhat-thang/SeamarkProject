import ChangePasswordForm from "../../components/ChangePasswordForm";
import UpdateNameForm from "../../components/UpdateNameForm";

export default function AccountPage() {
  return (
    <div>
      <div className="page-head">
        <h1>Tài khoản</h1>
      </div>

      <h2 style={{ fontSize: "1.05rem", color: "var(--navy)" }}>Tên hiển thị</h2>
      <UpdateNameForm />

      <h2 style={{ fontSize: "1.05rem", color: "var(--navy)" }}>Đổi mật khẩu</h2>
      <ChangePasswordForm />
    </div>
  );
}
