import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const EMPTY_FORM = { full_name: "", phone: "", email: "", campus: "" };

export default function TeachersPage() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadTeachers();
  }, []);

  async function loadTeachers() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("teachers")
      .select("*")
      .order("full_name");
    if (loadError) setError(loadError.message);
    else setTeachers(data);
    setLoading(false);
  }

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(teacher) {
    setForm({
      full_name: teacher.full_name || "",
      phone: teacher.phone || "",
      email: teacher.email || "",
      campus: teacher.campus || "",
    });
    setEditingId(teacher.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim()) {
      setError("Vui lòng nhập họ tên giáo viên.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = {
      full_name: form.full_name.trim(),
      phone: form.phone.trim() || null,
      email: form.email.trim() || null,
      campus: form.campus.trim() || null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("teachers").update(payload).eq("id", editingId)
      : await supabase.from("teachers").insert(payload);

    setSubmitting(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    loadTeachers();
  }

  async function handleDelete(teacher) {
    if (!confirm(`Xoá giáo viên "${teacher.full_name}"? Lịch dạy của giáo viên này cũng sẽ bị xoá.`)) return;
    const { error: deleteError } = await supabase.from("teachers").delete().eq("id", teacher.id);
    if (deleteError) setError(deleteError.message);
    else loadTeachers();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Giáo viên</h1>
        <button className="btn-primary" onClick={showForm ? () => setShowForm(false) : openCreateForm}>
          {showForm ? "Đóng" : "+ Thêm giáo viên"}
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Họ tên
              <input
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                required
              />
            </label>
            <label>
              Số điện thoại
              <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label>
              Email
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </label>
            <label>
              Cơ sở
              <input
                value={form.campus}
                onChange={(e) => setForm({ ...form, campus: e.target.value })}
                placeholder="VD: CS1 - TP Vinh"
              />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={submitting}>
              {editingId ? "Cập nhật" : "Lưu"}
            </button>
            <button className="btn-secondary" type="button" onClick={() => setShowForm(false)}>
              Huỷ
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="empty-note">Đang tải...</p>
      ) : teachers.length === 0 ? (
        <p className="empty-note">Chưa có giáo viên nào.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>SĐT</th>
              <th>Email</th>
              <th>Cơ sở</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => (
              <tr key={t.id}>
                <td>{t.full_name}</td>
                <td>{t.phone || "—"}</td>
                <td>{t.email || "—"}</td>
                <td>{t.campus || "—"}</td>
                <td className="row-actions">
                  <Link className="btn-link" to={`/admin/teachers/${t.id}`}>Xem lịch dạy</Link>
                  <button className="btn-secondary" onClick={() => openEditForm(t)}>Sửa</button>
                  <button className="btn-danger" onClick={() => handleDelete(t)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
