import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 6) {
      setError("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirm) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    setPassword("");
    setConfirm("");
    setSuccess("Đã đổi mật khẩu thành công.");
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <label>
          Mật khẩu mới
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
        <label>
          Xác nhận mật khẩu mới
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
        </label>
      </div>
      {error && <p className="field-error">{error}</p>}
      {success && <p style={{ color: "var(--navy)", fontWeight: 600 }}>{success}</p>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
      </div>
    </form>
  );
}
