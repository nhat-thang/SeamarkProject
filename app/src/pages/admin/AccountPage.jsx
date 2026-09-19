import ChangePasswordForm from "../../components/ChangePasswordForm";

export default function AccountPage() {
  return (
    <div>
      <div className="page-head">
        <h1>Tài khoản</h1>
      </div>
      <h2 style={{ fontSize: "1.05rem", color: "var(--navy)" }}>Đổi mật khẩu</h2>
      <ChangePasswordForm />
    </div>
  );
}
