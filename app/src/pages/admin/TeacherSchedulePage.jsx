import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../../lib/supabaseClient";

const DAYS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

const EMPTY_SLOT_FORM = { class_section_id: "", start_time: "", end_time: "", room: "" };

function toMinutes(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(t) {
  return t ? t.slice(0, 5) : "";
}

export default function TeacherSchedulePage() {
  const { teacherId } = useParams();
  const [teacher, setTeacher] = useState(null);
  const [classSections, setClassSections] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // { day, editingSlotId } khi form đang mở; null khi đóng
  const [activeDay, setActiveDay] = useState(null);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [form, setForm] = useState(EMPTY_SLOT_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
  }, [teacherId]);

  async function loadAll() {
    setLoading(true);
    const [teacherRes, sectionsRes, slotsRes] = await Promise.all([
      supabase.from("teachers").select("*").eq("id", teacherId).single(),
      supabase.from("class_sections").select("id, name").order("name"),
      supabase
        .from("schedule_slots")
        .select("*, class_sections(name)")
        .eq("teacher_id", teacherId)
        .order("start_time"),
    ]);
    if (teacherRes.error) setError(teacherRes.error.message);
    else setTeacher(teacherRes.data);
    if (sectionsRes.error) setError(sectionsRes.error.message);
    else setClassSections(sectionsRes.data);
    if (slotsRes.error) setError(slotsRes.error.message);
    else setSlots(slotsRes.data);
    setLoading(false);
  }

  function openAddForm(day) {
    setActiveDay(day);
    setEditingSlotId(null);
    setForm(EMPTY_SLOT_FORM);
    setFormError("");
  }

  function openEditForm(slot) {
    setActiveDay(slot.day_of_week);
    setEditingSlotId(slot.id);
    setForm({
      class_section_id: slot.class_section_id,
      start_time: formatTime(slot.start_time),
      end_time: formatTime(slot.end_time),
      room: slot.room || "",
    });
    setFormError("");
  }

  function closeForm() {
    setActiveDay(null);
    setEditingSlotId(null);
    setFormError("");
  }

  async function handleSubmit(e, day) {
    e.preventDefault();
    if (!form.class_section_id || !form.start_time || !form.end_time) {
      setFormError("Vui lòng chọn lớp học và điền đủ giờ bắt đầu/kết thúc.");
      return;
    }
    if (toMinutes(form.start_time) >= toMinutes(form.end_time)) {
      setFormError("Giờ kết thúc phải sau giờ bắt đầu.");
      return;
    }

    const overlap = slots.some((s) => {
      if (s.day_of_week !== day) return false;
      if (editingSlotId && s.id === editingSlotId) return false;
      const existingStart = toMinutes(formatTime(s.start_time));
      const existingEnd = toMinutes(formatTime(s.end_time));
      return toMinutes(form.start_time) < existingEnd && existingStart < toMinutes(form.end_time);
    });
    if (overlap) {
      setFormError("Trùng giờ với 1 buổi dạy khác của giáo viên này trong ngày này.");
      return;
    }

    setFormError("");
    setSubmitting(true);

    const payload = {
      teacher_id: teacherId,
      class_section_id: form.class_section_id,
      day_of_week: day,
      start_time: form.start_time,
      end_time: form.end_time,
      room: form.room.trim() || null,
    };

    const { error: saveError } = editingSlotId
      ? await supabase.from("schedule_slots").update(payload).eq("id", editingSlotId)
      : await supabase.from("schedule_slots").insert(payload);

    setSubmitting(false);
    if (saveError) {
      setFormError(saveError.message);
      return;
    }
    closeForm();
    loadAll();
  }

  async function handleDeleteSlot(slot) {
    if (!confirm("Xoá buổi dạy này khỏi lịch?")) return;
    const { error: deleteError } = await supabase.from("schedule_slots").delete().eq("id", slot.id);
    if (deleteError) setError(deleteError.message);
    else loadAll();
  }

  if (loading) return <p className="empty-note">Đang tải...</p>;
  if (!teacher) return <p className="empty-note">Không tìm thấy giáo viên.</p>;

  return (
    <div>
      <div className="schedule-back">
        <Link className="btn-link" to="/admin/teachers">← Danh sách giáo viên</Link>
      </div>

      <div className="teacher-card">
        <h1>{teacher.full_name}</h1>
        <p>{[teacher.campus, teacher.phone, teacher.email].filter(Boolean).join(" · ") || "Chưa có thông tin liên hệ"}</p>
      </div>

      {error && <p className="field-error">{error}</p>}

      {classSections.length === 0 && (
        <p className="empty-note">
          Chưa có lớp học nào — vào mục "Lớp học" ở menu bên trái để tạo trước khi xếp lịch dạy.
        </p>
      )}

      <div className="weekly-grid">
        {DAYS.map((day) => {
          const daySlots = slots
            .filter((s) => s.day_of_week === day.value)
            .sort((a, b) => a.start_time.localeCompare(b.start_time));
          const formOpenHere = activeDay === day.value;

          return (
            <div className="day-column" key={day.value}>
              <h3>{day.label}</h3>

              {daySlots.length === 0 && !formOpenHere && (
                <p className="empty-note" style={{ padding: 0, fontSize: "0.78rem" }}>Chưa có buổi dạy</p>
              )}

              {daySlots.map((slot) => (
                <div className="slot-card" key={slot.id}>
                  <strong>{formatTime(slot.start_time)} – {formatTime(slot.end_time)}</strong>
                  <span>{slot.class_sections?.name || "(lớp đã bị xoá)"}</span>
                  {slot.room && <span>Phòng: {slot.room}</span>}
                  <div className="row-actions">
                    <button className="btn-link" onClick={() => openEditForm(slot)}>Sửa</button>
                    <button className="btn-link" onClick={() => handleDeleteSlot(slot)}>Xoá</button>
                  </div>
                </div>
              ))}

              {formOpenHere ? (
                <form className="inline-slot-form" onSubmit={(e) => handleSubmit(e, day.value)}>
                  <select
                    value={form.class_section_id}
                    onChange={(e) => setForm({ ...form, class_section_id: e.target.value })}
                  >
                    <option value="">— Chọn lớp học —</option>
                    {classSections.map((cs) => (
                      <option key={cs.id} value={cs.id}>{cs.name}</option>
                    ))}
                  </select>
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  />
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Phòng (tuỳ chọn)"
                    value={form.room}
                    onChange={(e) => setForm({ ...form, room: e.target.value })}
                  />
                  {formError && <p className="field-error" style={{ margin: 0 }}>{formError}</p>}
                  <div className="row-actions">
                    <button className="btn-primary" type="submit" disabled={submitting}>
                      {editingSlotId ? "Cập nhật" : "Lưu"}
                    </button>
                    <button className="btn-secondary" type="button" onClick={closeForm}>Huỷ</button>
                  </div>
                </form>
              ) : (
                <button className="add-slot-toggle" onClick={() => openAddForm(day.value)}>
                  + Thêm buổi dạy
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
