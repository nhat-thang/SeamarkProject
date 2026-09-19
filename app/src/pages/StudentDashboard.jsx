import { useEffect, useState } from "react";
import { useAuth } from "../lib/AuthContext";
import { supabase } from "../lib/supabaseClient";

const DAYS = [
  { value: 1, label: "Thứ 2" },
  { value: 2, label: "Thứ 3" },
  { value: 3, label: "Thứ 4" },
  { value: 4, label: "Thứ 5" },
  { value: 5, label: "Thứ 6" },
  { value: 6, label: "Thứ 7" },
  { value: 0, label: "Chủ nhật" },
];

const TABS = [
  { key: "schedule", label: "Thời khoá biểu" },
  { key: "payments", label: "Học phí" },
  { key: "materials", label: "Tài liệu" },
  { key: "attendance", label: "Điểm danh" },
  { key: "messages", label: "Hộp thư" },
];

function formatTime(t) {
  return t ? t.slice(0, 5) : "";
}

function formatMoney(n) {
  return n == null ? "—" : `${Number(n).toLocaleString("vi-VN")}đ`;
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("schedule");

  const [scheduleSlots, setScheduleSlots] = useState([]);
  const [payments, setPayments] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (profile?.id) loadAll(profile.id);
  }, [profile?.id]);

  async function loadAll(studentId) {
    setLoading(true);

    const { data: enrollments, error: enrollError } = await supabase
      .from("enrollments")
      .select("class_section_id")
      .eq("student_id", studentId)
      .eq("status", "active");

    if (enrollError) {
      setError(enrollError.message);
      setLoading(false);
      return;
    }

    const classSectionIds = (enrollments || []).map((e) => e.class_section_id);

    const [scheduleRes, paymentsRes, materialsRes, attendanceRes, conversationRes] = await Promise.all([
      classSectionIds.length
        ? supabase
            .from("schedule_slots")
            .select("*, class_sections(name), teachers(full_name)")
            .in("class_section_id", classSectionIds)
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("payments")
        .select("*")
        .eq("student_id", studentId)
        .order("payment_date", { ascending: false }),
      classSectionIds.length
        ? supabase
            .from("materials")
            .select("*, class_sections(name)")
            .in("class_section_id", classSectionIds)
            .order("created_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      supabase
        .from("attendance")
        .select("*")
        .eq("student_id", studentId)
        .order("session_date", { ascending: false }),
      supabase
        .from("conversations")
        .select("id, conversation_messages(id, body, sender_role, attachment_url, attachment_type, read_by_student, created_at)")
        .eq("student_id", studentId)
        .maybeSingle(),
    ]);

    if (scheduleRes.error) setError(scheduleRes.error.message);
    else setScheduleSlots(scheduleRes.data);
    if (paymentsRes.error) setError(paymentsRes.error.message);
    else setPayments(paymentsRes.data);
    if (materialsRes.error) setError(materialsRes.error.message);
    else setMaterials(materialsRes.data);
    if (attendanceRes.error) setError(attendanceRes.error.message);
    else setAttendance(attendanceRes.data);
    if (conversationRes.error) setError(conversationRes.error.message);
    else {
      setConversationId(conversationRes.data?.id || null);
      const msgs = (conversationRes.data?.conversation_messages || [])
        .slice()
        .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      setMessages(msgs);
    }

    setLoading(false);
  }

  async function markThreadRead() {
    const unreadIds = messages.filter((m) => m.sender_role === "admin" && !m.read_by_student).map((m) => m.id);
    if (unreadIds.length === 0) return;
    await supabase.from("conversation_messages").update({ read_by_student: true }).in("id", unreadIds);
    setMessages((prev) => prev.map((m) => (unreadIds.includes(m.id) ? { ...m, read_by_student: true } : m)));
  }

  async function handleReplySubmit(e) {
    e.preventDefault();
    if (!replyText.trim() && !replyFile) return;
    setError("");
    setSending(true);
    try {
      let convId = conversationId;
      if (!convId) {
        const { data, error: convError } = await supabase
          .from("conversations")
          .insert({ student_id: profile.id })
          .select()
          .single();
        if (convError) throw convError;
        convId = data.id;
        setConversationId(convId);
      }

      let attachment_url = null;
      let attachment_type = null;
      if (replyFile) {
        const path = `${Date.now()}_${replyFile.name}`;
        const { error: uploadError } = await supabase.storage.from("message-attachments").upload(path, replyFile);
        if (uploadError) throw uploadError;
        attachment_url = path;
        attachment_type = replyFile.type.startsWith("image/") ? "image" : "file";
      }

      const { error: insertError } = await supabase.from("conversation_messages").insert({
        conversation_id: convId,
        sender_id: profile.id,
        sender_role: "student",
        body: replyText.trim() || null,
        attachment_url,
        attachment_type,
        read_by_student: true,
      });
      if (insertError) throw insertError;

      setReplyText("");
      setReplyFile(null);
      loadAll(profile.id);
    } catch (err) {
      setError(err.message);
    }
    setSending(false);
  }

  async function handleDownloadMaterial(path) {
    const { data, error: signError } = await supabase.storage.from("materials").createSignedUrl(path, 3600);
    if (signError) {
      setError(signError.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleDownloadAttachment(path) {
    const { data, error: signError } = await supabase.storage.from("message-attachments").createSignedUrl(path, 3600);
    if (signError) {
      setError(signError.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const unreadCount = messages.filter((m) => m.sender_role === "admin" && !m.read_by_student).length;

  return (
    <div className="dashboard-screen">
      <header className="dashboard-header">
        <div>
          <strong>Khu vực Học viên</strong>
          <span>Xin chào, {profile?.full_name}</span>
        </div>
        <button onClick={signOut}>Đăng xuất</button>
      </header>

      <main className="dashboard-body wide">
        {error && <p className="field-error">{error}</p>}

        <div className="tab-bar">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={activeTab === t.key ? "active" : ""}
              onClick={() => {
                setActiveTab(t.key);
                if (t.key === "messages") markThreadRead();
              }}
            >
              {t.label}
              {t.key === "messages" && unreadCount > 0 ? ` (${unreadCount})` : ""}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="empty-note">Đang tải...</p>
        ) : (
          <>
            {activeTab === "schedule" && (
              <div className="weekly-grid">
                {DAYS.map((day) => {
                  const daySlots = scheduleSlots
                    .filter((s) => s.day_of_week === day.value)
                    .sort((a, b) => a.start_time.localeCompare(b.start_time));
                  return (
                    <div className="day-column" key={day.value}>
                      <h3>{day.label}</h3>
                      {daySlots.length === 0 ? (
                        <p className="empty-note" style={{ padding: 0, fontSize: "0.78rem" }}>Không có lịch</p>
                      ) : (
                        daySlots.map((s) => (
                          <div className="slot-card" key={s.id}>
                            <strong>{formatTime(s.start_time)} – {formatTime(s.end_time)}</strong>
                            <span>{s.class_sections?.name}</span>
                            <span>GV: {s.teachers?.full_name || "chưa phân công"}</span>
                            {s.room && <span>Phòng: {s.room}</span>}
                          </div>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {activeTab === "payments" && (
              <div>
                <div className="summary-row">
                  <div className="summary-tile">
                    <span>Tổng đã đóng</span>
                    <strong>{formatMoney(totalPaid)}</strong>
                  </div>
                </div>
                {payments.length === 0 ? (
                  <p className="empty-note">Chưa có khoản học phí nào được ghi nhận.</p>
                ) : (
                  payments.map((p) => (
                    <div className="info-card" key={p.id}>
                      <strong>{formatMoney(p.amount)} — {p.month_applied || "chưa gán tháng"}</strong>
                      <span>
                        Ngày: {p.payment_date} · {p.method === "tien_mat" ? "Tiền mặt" : "Chuyển khoản"}
                        {p.note ? ` · ${p.note}` : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "materials" && (
              <div>
                {materials.length === 0 ? (
                  <p className="empty-note">Chưa có tài liệu nào cho lớp bạn đang học.</p>
                ) : (
                  materials.map((m) => (
                    <div className="info-card" key={m.id}>
                      <strong>{m.title}</strong>
                      <span>Lớp: {m.class_sections?.name}</span>
                      <button className="btn-link" onClick={() => handleDownloadMaterial(m.file_url)}>
                        Tải xuống
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "attendance" && (
              <div>
                {attendance.length === 0 ? (
                  <p className="empty-note">Chưa có dữ liệu điểm danh.</p>
                ) : (
                  attendance.map((a) => (
                    <div className="info-card" key={a.id}>
                      <strong>
                        {a.session_date} —{" "}
                        {a.status === "present" ? "Có mặt" : a.status === "late" ? "Đi muộn" : "Vắng"}
                      </strong>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "messages" && (
              <div className="chat-shell" style={{ height: 480 }}>
                <div className="chat-thread">
                  <div className="chat-thread-header">Tin nhắn với Anh ngữ Seamark</div>
                  <div className="chat-thread-messages">
                    {messages.length === 0 ? (
                      <p className="empty-note">Chưa có tin nhắn nào — gửi tin đầu tiên bên dưới.</p>
                    ) : (
                      messages.map((m) => (
                        <div className={`chat-bubble ${m.sender_role === "student" ? "mine" : "theirs"}`} key={m.id}>
                          {m.body}
                          {m.attachment_url && (
                            <div>
                              <a onClick={(e) => { e.preventDefault(); handleDownloadAttachment(m.attachment_url); }} href="#">
                                Xem đính kèm ({m.attachment_type === "image" ? "ảnh" : "file"})
                              </a>
                            </div>
                          )}
                          <time>{new Date(m.created_at).toLocaleString("vi-VN")}</time>
                        </div>
                      ))
                    )}
                  </div>
                  <form className="chat-thread-input" onSubmit={handleReplySubmit}>
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                    />
                    <input type="file" onChange={(e) => setReplyFile(e.target.files[0] || null)} />
                    <button className="btn-primary" type="submit" disabled={sending}>Gửi</button>
                  </form>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
