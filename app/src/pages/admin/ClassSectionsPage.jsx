import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const EMPTY_FORM = { name: "", course_id: "", campus: "" };

export default function ClassSectionsPage() {
  const [sections, setSections] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    const [sectionsRes, coursesRes] = await Promise.all([
      supabase
        .from("class_sections")
        .select("*, courses(name)")
        .order("name"),
      supabase.from("courses").select("id, name").order("name"),
    ]);
    if (sectionsRes.error) setError(sectionsRes.error.message);
    else setSections(sectionsRes.data);
    if (coursesRes.error) setError(coursesRes.error.message);
    else setCourses(coursesRes.data);
    setLoading(false);
  }

  function openCreateForm() {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
  }

  function openEditForm(section) {
    setForm({
      name: section.name || "",
      course_id: section.course_id || "",
      campus: section.campus || "",
    });
    setEditingId(section.id);
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Vui lòng nhập tên lớp học.");
      return;
    }
    setError("");
    setSubmitting(true);

    const payload = {
      name: form.name.trim(),
      course_id: form.course_id || null,
      campus: form.campus.trim() || null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("class_sections").update(payload).eq("id", editingId)
      : await supabase.from("class_sections").insert(payload);

    setSubmitting(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setShowForm(false);
    setForm(EMPTY_FORM);
    setEditingId(null);
    loadData();
  }

  async function handleDelete(section) {
    if (!confirm(`Xoá lớp học "${section.name}"? Lịch dạy và ghi danh gắn với lớp này cũng sẽ bị xoá.`)) return;
    const { error: deleteError } = await supabase.from("class_sections").delete().eq("id", section.id);
    if (deleteError) setError(deleteError.message);
    else loadData();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Lớp học</h1>
        <button className="btn-primary" onClick={showForm ? () => setShowForm(false) : openCreateForm}>
          {showForm ? "Đóng" : "+ Thêm lớp học"}
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}

      {showForm && (
        <form className="form-card" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Tên lớp học
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="VD: IELTS tối 3-5-7"
                required
              />
            </label>
            <label>
              Thuộc khoá học
              <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })}>
                <option value="">— Chọn khoá học —</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
            <label>
              Cơ sở
              <input value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} />
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
      ) : sections.length === 0 ? (
        <p className="empty-note">Chưa có lớp học nào. Tạo khoá học trước, sau đó thêm lớp học thuộc khoá đó.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên lớp</th>
              <th>Khoá học</th>
              <th>Cơ sở</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sections.map((s) => (
              <tr key={s.id}>
                <td>{s.name}</td>
                <td>{s.courses?.name || "—"}</td>
                <td>{s.campus || "—"}</td>
                <td className="row-actions">
                  <button className="btn-secondary" onClick={() => openEditForm(s)}>Sửa</button>
                  <button className="btn-danger" onClick={() => handleDelete(s)}>Xoá</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
