import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const EMPTY_FORM = { name: "", age_range: "", fee_per_month: "", description: "" };

export default function CoursesPage() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCourses();
  }, []);

  async function loadCourses() {
    setLoading(true);
    const { data, error: loadError } = await supabase.from("courses").select("*").order("name");
    if (loadError) setError(loadError.message);
    else setCourses(data);
    setLoading(false);
  }

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(course) {
    setForm({
      name: course.name || "",
      age_range: course.age_range || "",
      fee_per_month: course.fee_per_month ?? "",
      description: course.description || "",
    });
    setEditingId(course.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên khoá học.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      age_range: form.age_range.trim() || null,
      fee_per_month: form.fee_per_month === "" ? null : Number(form.fee_per_month),
      description: form.description.trim() || null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("courses").update(payload).eq("id", editingId)
      : await supabase.from("courses").insert(payload);

    setSubmitting(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    loadCourses();
  }

  async function handleDelete(course) {
    if (!confirm(`Xoá khoá học "${course.name}"? Các lớp học thuộc khoá này sẽ mất liên kết.`)) return;
    const { error: deleteError } = await supabase.from("courses").delete().eq("id", course.id);
    if (deleteError) setError(deleteError.message);
    else loadCourses();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Khoá học</h1>
        <button className="btn-primary" onClick={showForm ? () => setShowForm(false) : openCreateForm}>
          {showForm ? "Đóng" : "+ Thêm khoá học"}
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Tên khoá học
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
            </label>
            <label>
              Độ tuổi
              <input
                value={form.age_range}
                onChange={(e) => setForm({ ...form, age_range: e.target.value })}
                placeholder="VD: 6 - 11 tuổi"
              />
            </label>
            <label>
              Học phí/tháng (VNĐ)
              <input
                type="number"
                min="0"
                value={form.fee_per_month}
                onChange={(e) => setForm({ ...form, fee_per_month: e.target.value })}
              />
            </label>
            <label>
              Mô tả
              <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
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
      ) : courses.length === 0 ? (
        <p className="empty-note">Chưa có khoá học nào.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên khoá học</th>
              <th>Độ tuổi</th>
              <th>Học phí/tháng</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.age_range || "—"}</td>
                <td>{c.fee_per_month ? `${Number(c.fee_per_month).toLocaleString("vi-VN")}đ` : "—"}</td>
                <td className="row-actions">
                  <button className="btn-secondary" onClick={() => openEditForm(c)}>Sửa</button>
                  <button className="btn-danger" onClick={() => handleDelete(c)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
