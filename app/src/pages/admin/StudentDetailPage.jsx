import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";

const EMPTY_PAYMENT_FORM = {
  amount: "",
  payment_date: new Date().toISOString().slice(0, 10),
  method: "chuyen_khoan",
  month_applied: "",
  note: "",
};

const EMPTY_ATTENDANCE_FORM = {
  session_date: new Date().toISOString().slice(0, 10),
  schedule_slot_id: "",
  status: "present",
};

function formatMoney(n) {
  return n == null ? "—" : `${Number(n).toLocaleString("vi-VN")}đ`;
}

export default function StudentDetailPage() {
  const { studentId } = useParams();
  const { profile } = useAuth();

  const [student, setStudent] = useState(null);
  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [payments, setPayments] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeTab, setActiveTab] = useState("payments");

  const [resetting, setResetting] = useState(false);
  const [resetPassword, setResetPassword] = useState(null);
  const [resetError, setResetError] = useState("");

  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState(EMPTY_PAYMENT_FORM);
  const [paymentError, setPaymentError] = useState("");
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);

  const [showAttendanceForm, setShowAttendanceForm] = useState(false);
  const [attendanceForm, setAttendanceForm] = useState(EMPTY_ATTENDANCE_FORM);
  const [attendanceError, setAttendanceError] = useState("");
  const [attendanceSubmitting, setAttendanceSubmitting] = useState(false);

  useEffect(() => {
    loadAll();
  }, [studentId]);

  async function loadAll() {
    setLoading(true);

    const { data: studentRow, error: studentError } = await supabase
      .from("students")
      .select("*, profiles(full_name, phone)")
      .eq("id", studentId)
      .single();
    if (studentError) setError(studentError.message);
    else setStudent(studentRow);

    const { data: enrollments } = await supabase
      .from("enrollments")
      .select("class_section_id")
      .eq("student_id", studentId)
      .eq("status", "active");
    const classSectionIds = (enrollments || []).map((e) => e.class_section_id);

    const [slotsRes, paymentsRes, attendanceRes] = await Promise.all([
      classSectionIds.length
        ? supabase
            .from("schedule_slots")
            .select("*, class_sections(name)")
            .in("class_section_id", classSectionIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("payments")
        .select("*")
        .eq("student_id", studentId)
        .order("payment_date", { ascending: false }),
      supabase
        .from("attendance")
        .select("*, schedule_slots(class_sections(name))")
        .eq("student_id", studentId)
        .order("session_date", { ascending: false }),
    ]);

    if (slotsRes.error) setError(slotsRes.error.message);
    else setScheduleSlots(slotsRes.data);
    if (paymentsRes.error) setError(paymentsRes.error.message);
    else setPayments(paymentsRes.data);
    if (attendanceRes.error) setError(attendanceRes.error.message);
    else setAttendance(attendanceRes.data);

    setLoading(false);
  }

  async function handlePaymentSubmit(e) {
    e.preventDefault();
    if (!paymentForm.amount || Number(paymentForm.amount) <= 0) {
      setPaymentError("Vui lòng nhập số tiền hợp lệ.");
      return;
    }
    setPaymentError("");
    setPaymentSubmitting(true);
    const { error: insertError } = await supabase.from("payments").insert({
      student_id: studentId,
      amount: Number(paymentForm.amount),
      payment_date: paymentForm.payment_date,
      method: paymentForm.method,
      month_applied: paymentForm.month_applied.trim() || null,
      note: paymentForm.note.trim() || null,
      recorded_by: profile?.id,
    });
    setPaymentSubmitting(false);
    if (insertError) {
      setPaymentError(insertError.message);
      return;
    }
    setShowPaymentForm(false);
    setPaymentForm(EMPTY_PAYMENT_FORM);
    loadAll();
  }

  async function handleDeletePayment(payment) {
    if (!confirm("Xoá khoản học phí này?")) return;
    const { error: deleteError } = await supabase.from("payments").delete().eq("id", payment.id);
    if (deleteError) setError(deleteError.message);
    else loadAll();
  }

  async function handleAttendanceSubmit(e) {
    e.preventDefault();
    setAttendanceError("");
    setAttendanceSubmitting(true);
    const { error: insertError } = await supabase.from("attendance").insert({
      student_id: studentId,
      schedule_slot_id: attendanceForm.schedule_slot_id || null,
      session_date: attendanceForm.session_date,
      status: attendanceForm.status,
      recorded_by: profile?.id,
    });
    setAttendanceSubmitting(false);
    if (insertError) {
      setAttendanceError(insertError.message);
      return;
    }
    setShowAttendanceForm(false);
    setAttendanceForm(EMPTY_ATTENDANCE_FORM);
    loadAll();
  }

  async function handleDeleteAttendance(row) {
    if (!confirm("Xoá bản ghi điểm danh này?")) return;
    const { error: deleteError } = await supabase.from("attendance").delete().eq("id", row.id);
    if (deleteError) setError(deleteError.message);
    else loadAll();
  }

  async function handleResetPassword() {
    if (!confirm(`Cấp lại mật khẩu mới cho "${student.profiles?.full_name}"? Mật khẩu cũ sẽ không dùng được nữa.`)) return;
    setResetError("");
    setResetPassword(null);
    setResetting(true);
    const { data, error: invokeError } = await supabase.functions.invoke("reset-student-password", {
      body: { student_id: studentId },
    });
    setResetting(false);
    if (invokeError || data?.error) {
      setResetError(data?.error || invokeError.message);
      return;
    }
    setResetPassword(data.password);
  }

  if (loading) return <p className="empty-note">Đang tải...</p>;
  if (!student) return <p className="empty-note">Không tìm thấy học viên.</p>;

  return (
    <div>
      <div className="schedule-back">
        <Link className="btn-link" to="/admin/students">← Danh sách học viên</Link>
      </div>

      <div className="teacher-card">
        <h1>{student.profiles?.full_name}</h1>
        <p>{[student.campus, student.profiles?.phone, student.parent_name].filter(Boolean).join(" · ") || "Chưa có thông tin"}</p>
        <div className="form-actions" style={{ marginTop: 12 }}>
          <button className="btn-secondary" onClick={handleResetPassword} disabled={resetting}>
            {resetting ? "Đang cấp lại..." : "Đặt lại mật khẩu"}
          </button>
        </div>
        {resetError && <p className="field-error">{resetError}</p>}
        {resetPassword && (
          <p style={{ marginTop: 10 }}>
            Mật khẩu mới: <strong>{resetPassword}</strong> — gửi ngay cho phụ huynh, mật khẩu này chỉ hiện 1 lần.
          </p>
        )}
      </div>

      {error && <p className="field-error">{error}</p>}

      <div className="tab-bar">
        <button className={activeTab === "payments" ? "active" : ""} onClick={() => setActiveTab("payments")}>
          Học phí
        </button>
        <button className={activeTab === "attendance" ? "active" : ""} onClick={() => setActiveTab("attendance")}>
          Điểm danh
        </button>
      </div>

      {activeTab === "payments" && (
        <div>
          <div className="page-head">
            <h2 style={{ fontSize: "1.05rem", color: "var(--navy)", margin: 0 }}>Ghi nhận học phí</h2>
            <button className="btn-primary" onClick={() => setShowPaymentForm((v) => !v)}>
              {showPaymentForm ? "Đóng" : "+ Ghi nhận học phí"}
            </button>
          </div>

          {showPaymentForm && (
            <form className="form-card" onSubmit={handlePaymentSubmit}>
              <div className="form-grid">
                <label>
                  Số tiền (VNĐ)
                  <input
                    type="number"
                    min="0"
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Ngày đóng
                  <input
                    type="date"
                    value={paymentForm.payment_date}
                    onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  />
                </label>
                <label>
                  Hình thức
                  <select
                    value={paymentForm.method}
                    onChange={(e) => setPaymentForm({ ...paymentForm, method: e.target.value })}
                  >
                    <option value="chuyen_khoan">Chuyển khoản</option>
                    <option value="tien_mat">Tiền mặt</option>
                  </select>
                </label>
                <label>
                  Áp dụng cho tháng
                  <input
                    value={paymentForm.month_applied}
                    onChange={(e) => setPaymentForm({ ...paymentForm, month_applied: e.target.value })}
                    placeholder="VD: 2026-10"
                  />
                </label>
                <label>
                  Ghi chú
                  <input
                    value={paymentForm.note}
                    onChange={(e) => setPaymentForm({ ...paymentForm, note: e.target.value })}
                  />
                </label>
              </div>
              {paymentError && <p className="field-error">{paymentError}</p>}
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={paymentSubmitting}>Lưu</button>
                <button className="btn-secondary" type="button" onClick={() => setShowPaymentForm(false)}>Huỷ</button>
              </div>
            </form>
          )}

          {payments.length === 0 ? (
            <p className="empty-note">Chưa có khoản học phí nào.</p>
          ) : (
            payments.map((p) => (
              <div className="info-card" key={p.id}>
                <strong>{formatMoney(p.amount)} — {p.month_applied || "chưa gán tháng"}</strong>
                <span>
                  Ngày: {p.payment_date} · {p.method === "tien_mat" ? "Tiền mặt" : "Chuyển khoản"}
                  {p.note ? ` · ${p.note}` : ""}
                </span>
                <div className="row-actions" style={{ marginTop: 6 }}>
                  <button className="btn-link" onClick={() => handleDeletePayment(p)}>Xoá</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "attendance" && (
        <div>
          <div className="page-head">
            <h2 style={{ fontSize: "1.05rem", color: "var(--navy)", margin: 0 }}>Điểm danh</h2>
            <button className="btn-primary" onClick={() => setShowAttendanceForm((v) => !v)}>
              {showAttendanceForm ? "Đóng" : "+ Điểm danh"}
            </button>
          </div>

          {scheduleSlots.length === 0 && (
            <p className="empty-note">
              Học viên chưa được ghi danh vào lớp có lịch dạy — vẫn điểm danh được nhưng sẽ không gắn với buổi học cụ thể.
            </p>
          )}

          {showAttendanceForm && (
            <form className="form-card" onSubmit={handleAttendanceSubmit}>
              <div className="form-grid">
                <label>
                  Ngày
                  <input
                    type="date"
                    value={attendanceForm.session_date}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, session_date: e.target.value })}
                  />
                </label>
                <label>
                  Buổi học (tuỳ chọn)
                  <select
                    value={attendanceForm.schedule_slot_id}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, schedule_slot_id: e.target.value })}
                  >
                    <option value="">— Không gắn buổi cụ thể —</option>
                    {scheduleSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.class_sections?.name} ({s.start_time.slice(0, 5)}–{s.end_time.slice(0, 5)})
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Trạng thái
                  <select
                    value={attendanceForm.status}
                    onChange={(e) => setAttendanceForm({ ...attendanceForm, status: e.target.value })}
                  >
                    <option value="present">Có mặt</option>
                    <option value="late">Đi muộn</option>
                    <option value="absent">Vắng</option>
                  </select>
                </label>
              </div>
              {attendanceError && <p className="field-error">{attendanceError}</p>}
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={attendanceSubmitting}>Lưu</button>
                <button className="btn-secondary" type="button" onClick={() => setShowAttendanceForm(false)}>Huỷ</button>
              </div>
            </form>
          )}

          {attendance.length === 0 ? (
            <p className="empty-note">Chưa có bản ghi điểm danh nào.</p>
          ) : (
            attendance.map((a) => (
              <div className="info-card" key={a.id}>
                <strong>
                  {a.session_date} — {a.status === "present" ? "Có mặt" : a.status === "late" ? "Đi muộn" : "Vắng"}
                </strong>
                <span>{a.schedule_slots?.class_sections?.name || "Không gắn buổi cụ thể"}</span>
                <div className="row-actions" style={{ marginTop: 6 }}>
                  <button className="btn-link" onClick={() => handleDeleteAttendance(a)}>Xoá</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
