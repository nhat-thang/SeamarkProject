import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabaseClient";

const EMPTY_CONFIRM_FORM = {
  full_name: "",
  email: "",
  phone: "",
  parent_name: "",
  parent_phone: "",
  campus: "",
  dob: "",
};

export default function StudentsPage() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [activeRequestId, setActiveRequestId] = useState(null); // null = thêm thủ công
  const [form, setForm] = useState(EMPTY_CONFIRM_FORM);
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [createdAccount, setCreatedAccount] = useState(null); // { email, password }

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [requestsRes, studentsRes] = await Promise.all([
      supabase
        .from("registration_requests")
        .select("*")
        .eq("status", "pending")
        .order("created_at", { ascending: false }),
      supabase
        .from("students")
        .select("*, profiles(full_name, phone)")
        .order("created_at", { ascending: false }),
    ]);
    if (requestsRes.error) setError(requestsRes.error.message);
    else setPendingRequests(requestsRes.data);
    if (studentsRes.error) setError(studentsRes.error.message);
    else setStudents(studentsRes.data);
    setLoading(false);
  }

  function openConfirmForm(request) {
    setActiveRequestId(request.id);
    setForm({
      full_name: request.full_name || "",
      email: "",
      phone: request.phone || "",
      parent_name: request.parent_name || "",
      parent_phone: "",
      campus: "",
      dob: "",
    });
    setFormError("");
    setCreatedAccount(null);
    setShowForm(true);
  }

  function openManualForm() {
    setActiveRequestId(null);
    setForm(EMPTY_CONFIRM_FORM);
    setFormError("");
    setCreatedAccount(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setActiveRequestId(null);
    setFormError("");
  }

  async function handleReject(request) {
    if (!confirm(`Từ chối yêu cầu đăng ký của "${request.full_name}"?`)) return;
    const { error: updateError } = await supabase
      .from("registration_requests")
      .update({ status: "rejected" })
      .eq("id", request.id);
    if (updateError) setError(updateError.message);
    else loadAll();
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.full_name.trim() || !form.email.trim()) {
      setFormError("Vui lòng nhập đủ họ tên và email đăng nhập.");
      return;
    }
    setFormError("");
    setSubmitting(true);

    const { data, error: invokeError } = await supabase.functions.invoke("create-student-account", {
      body: {
        full_name: form.full_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        parent_name: form.parent_name.trim() || null,
        parent_phone: form.parent_phone.trim() || null,
        campus: form.campus.trim() || null,
        dob: form.dob || null,
        registration_request_id: activeRequestId,
      },
    });

    setSubmitting(false);

    if (invokeError || data?.error) {
      setFormError(data?.error || invokeError.message);
      return;
    }

    setCreatedAccount({ email: data.email, password: data.password });
    loadAll();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Học viên</h1>
        <button className="btn-primary" onClick={showForm ? closeForm : openManualForm}>
          {showForm ? "Đóng" : "+ Thêm học viên thủ công"}
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}

      {showForm && (
        <div className="form-card">
          {createdAccount ? (
            <div>
              <p>
                <strong>Đã tạo tài khoản thành công!</strong> Gửi thông tin sau cho phụ huynh/học viên
                (mật khẩu chỉ hiển thị 1 lần duy nhất ở đây):
              </p>
              <p>Email đăng nhập: <strong>{createdAccount.email}</strong></p>
              <p>Mật khẩu: <strong>{createdAccount.password}</strong></p>
              <div className="form-actions">
                <button className="btn-primary" onClick={closeForm}>Đóng</button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <label>
                  Họ tên học viên
                  <input
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </label>
                <label>
                  Email đăng nhập
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="dùng để đăng nhập, không hiển thị công khai"
                    required
                  />
                </label>
                <label>
                  Số điện thoại học viên
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                </label>
                <label>
                  Ngày sinh
                  <input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
                </label>
                <label>
                  Tên phụ huynh
                  <input
                    value={form.parent_name}
                    onChange={(e) => setForm({ ...form, parent_name: e.target.value })}
                  />
                </label>
                <label>
                  SĐT phụ huynh
                  <input
                    value={form.parent_phone}
                    onChange={(e) => setForm({ ...form, parent_phone: e.target.value })}
                  />
                </label>
                <label>
                  Cơ sở
                  <input value={form.campus} onChange={(e) => setForm({ ...form, campus: e.target.value })} />
                </label>
              </div>
              {formError && <p className="field-error">{formError}</p>}
              <div className="form-actions">
                <button className="btn-primary" type="submit" disabled={submitting}>
                  {submitting ? "Đang tạo..." : "Tạo tài khoản học viên"}
                </button>
                <button className="btn-secondary" type="button" onClick={closeForm}>Huỷ</button>
              </div>
            </form>
          )}
        </div>
      )}

      <h2 style={{ fontSize: "1.05rem", color: "var(--navy)" }}>Đăng ký chờ xác nhận</h2>
      {loading ? (
        <p className="empty-note">Đang tải...</p>
      ) : pendingRequests.length === 0 ? (
        <p className="empty-note">Không có yêu cầu đăng ký nào đang chờ.</p>
      ) : (
        <table className="data-table" style={{ marginBottom: 28 }}>
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>SĐT</th>
              <th>Phụ huynh</th>
              <th>Khoá quan tâm</th>
              <th>Ghi chú</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pendingRequests.map((r) => (
              <tr key={r.id}>
                <td>{r.full_name}</td>
                <td>{r.phone}</td>
                <td>{r.parent_name || "—"}</td>
                <td>{r.course_interested || "—"}</td>
                <td>{r.note || "—"}</td>
                <td className="row-actions">
                  <button className="btn-primary" onClick={() => openConfirmForm(r)}>Xác nhận</button>
                  <button className="btn-danger" onClick={() => handleReject(r)}>Từ chối</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h2 style={{ fontSize: "1.05rem", color: "var(--navy)" }}>Danh sách học viên</h2>
      {loading ? (
        <p className="empty-note">Đang tải...</p>
      ) : students.length === 0 ? (
        <p className="empty-note">Chưa có học viên nào.</p>
      ) : (
        <table className="data-table">
          <thead>
            <tr>
              <th>Họ tên</th>
              <th>SĐT</th>
              <th>Phụ huynh</th>
              <th>Cơ sở</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s.id}>
                <td>{s.profiles?.full_name || "—"}</td>
                <td>{s.profiles?.phone || "—"}</td>
                <td>{s.parent_name || "—"}</td>
                <td>{s.campus || "—"}</td>
                <td>{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
