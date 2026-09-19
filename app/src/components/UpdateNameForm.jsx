import { useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";

export default function UpdateNameForm() {
  const { profile, refreshProfile } = useAuth();
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!fullName.trim()) {
      setError("Tên hiển thị không được để trống.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", profile.id);
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }
    await refreshProfile();
    setSuccess("Đã cập nhật tên hiển thị.");
  }

  return (
    <form className="form-card" onSubmit={handleSubmit} style={{ maxWidth: 360 }}>
      <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
        <label>
          Tên hiển thị
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
      </div>
      {error && <p className="field-error">{error}</p>}
      {success && <p style={{ color: "var(--navy)", fontWeight: 600 }}>{success}</p>}
      <div className="form-actions">
        <button className="btn-primary" type="submit" disabled={submitting}>
          {submitting ? "Đang lưu..." : "Lưu tên hiển thị"}
        </button>
      </div>
    </form>
  );
}
