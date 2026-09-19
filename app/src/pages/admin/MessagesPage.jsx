import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function MessagesPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [conversations, setConversations] = useState([]); // với conversation_messages lồng bên trong
  const [selectedStudentId, setSelectedStudentId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [replyText, setReplyText] = useState("");
  const [replyFile, setReplyFile] = useState(null);
  const [sending, setSending] = useState(false);

  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkSelectedIds, setBulkSelectedIds] = useState([]);
  const [bulkText, setBulkText] = useState("");
  const [bulkFile, setBulkFile] = useState(null);
  const [bulkSending, setBulkSending] = useState(false);
  const [bulkNotice, setBulkNotice] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [studentsRes, conversationsRes] = await Promise.all([
      supabase.from("students").select("id, profiles(full_name)").order("created_at", { ascending: false }),
      supabase
        .from("conversations")
        .select("id, student_id, conversation_messages(id, body, sender_role, attachment_url, attachment_type, read_by_admin, created_at)"),
    ]);
    if (studentsRes.error) setError(studentsRes.error.message);
    else setStudents(studentsRes.data);
    if (conversationsRes.error) setError(conversationsRes.error.message);
    else setConversations(conversationsRes.data);
    setLoading(false);
  }

  const conversationByStudent = useMemo(() => {
    const map = {};
    conversations.forEach((c) => (map[c.student_id] = c));
    return map;
  }, [conversations]);

  const studentList = useMemo(() => {
    return students
      .map((s) => {
        const conv = conversationByStudent[s.id];
        const msgs = conv?.conversation_messages || [];
        const last = msgs.length
          ? msgs.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b))
          : null;
        const unread = msgs.filter((m) => m.sender_role === "student" && !m.read_by_admin).length;
        return { id: s.id, full_name: s.profiles?.full_name || "(chưa có tên)", last, unread };
      })
      .sort((a, b) => new Date(b.last?.created_at || 0) - new Date(a.last?.created_at || 0));
  }, [students, conversationByStudent]);

  const selectedMessages = useMemo(() => {
    const conv = selectedStudentId ? conversationByStudent[selectedStudentId] : null;
    return (conv?.conversation_messages || []).slice().sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }, [selectedStudentId, conversationByStudent]);

  async function openThread(studentId) {
    setSelectedStudentId(studentId);
    const conv = conversationByStudent[studentId];
    if (!conv) return;
    const unreadIds = (conv.conversation_messages || [])
      .filter((m) => m.sender_role === "student" && !m.read_by_admin)
      .map((m) => m.id);
    if (unreadIds.length > 0) {
      await supabase.from("conversation_messages").update({ read_by_admin: true }).in("id", unreadIds);
      loadAll();
    }
  }

  async function ensureConversation(studentId) {
    const existing = conversationByStudent[studentId];
    if (existing) return existing.id;
    const { data, error: convError } = await supabase
      .from("conversations")
      .insert({ student_id: studentId })
      .select()
      .single();
    if (convError) throw convError;
    return data.id;
  }

  async function uploadAttachment(file) {
    const path = `${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("message-attachments").upload(path, file);
    if (uploadError) throw uploadError;
    return { attachment_url: path, attachment_type: file.type.startsWith("image/") ? "image" : "file" };
  }

  async function handleDownload(path) {
    const { data, error: signError } = await supabase.storage.from("message-attachments").createSignedUrl(path, 3600);
    if (signError) {
      setError(signError.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleReplySubmit(e) {
    e.preventDefault();
    if (!replyText.trim() && !replyFile) return;
    setError("");
    setSending(true);
    try {
      const conversationId = await ensureConversation(selectedStudentId);
      let attachment = { attachment_url: null, attachment_type: null };
      if (replyFile) attachment = await uploadAttachment(replyFile);

      const { error: insertError } = await supabase.from("conversation_messages").insert({
        conversation_id: conversationId,
        sender_id: profile?.id,
        sender_role: "admin",
        body: replyText.trim() || null,
        ...attachment,
        read_by_admin: true,
      });
      if (insertError) throw insertError;

      setReplyText("");
      setReplyFile(null);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
    setSending(false);
  }

  function toggleBulkStudent(id) {
    setBulkSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleBulkSelectAll() {
    setBulkSelectedIds((prev) => (prev.length === students.length ? [] : students.map((s) => s.id)));
  }

  async function handleBulkSend(e) {
    e.preventDefault();
    if (bulkSelectedIds.length === 0) {
      setError("Vui lòng chọn ít nhất 1 học viên nhận tin.");
      return;
    }
    if (!bulkText.trim() && !bulkFile) {
      setError("Vui lòng nhập nội dung hoặc đính kèm file/ảnh.");
      return;
    }
    setError("");
    setBulkSending(true);
    try {
      let attachment = { attachment_url: null, attachment_type: null };
      if (bulkFile) attachment = await uploadAttachment(bulkFile);

      for (const studentId of bulkSelectedIds) {
        const conversationId = await ensureConversation(studentId);
        const { error: insertError } = await supabase.from("conversation_messages").insert({
          conversation_id: conversationId,
          sender_id: profile?.id,
          sender_role: "admin",
          body: bulkText.trim() || null,
          ...attachment,
          read_by_admin: true,
        });
        if (insertError) throw insertError;
      }

      setBulkNotice(`Đã gửi tới ${bulkSelectedIds.length} học viên.`);
      setBulkText("");
      setBulkFile(null);
      setBulkSelectedIds([]);
      loadAll();
    } catch (err) {
      setError(err.message);
    }
    setBulkSending(false);
  }

  return (
    <div>
      <div className="page-head">
        <h1>Nhắn tin</h1>
        <button className="btn-secondary" onClick={() => setShowBulkForm((v) => !v)}>
          {showBulkForm ? "Đóng" : "+ Soạn tin gửi nhiều học viên"}
        </button>
      </div>

      {error && <p className="field-error">{error}</p>}

      {showBulkForm && (
        <form className="form-card" onSubmit={handleBulkSend}>
          {bulkNotice && <p style={{ color: "var(--navy)", fontWeight: 600 }}>{bulkNotice}</p>}
          <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
            <label>
              Người nhận
              <div style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 10, maxHeight: 160, overflowY: "auto" }}>
                <label style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <input
                    type="checkbox"
                    checked={students.length > 0 && bulkSelectedIds.length === students.length}
                    onChange={toggleBulkSelectAll}
                  />
                  Chọn tất cả học viên
                </label>
                {students.map((s) => (
                  <label key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={bulkSelectedIds.includes(s.id)}
                      onChange={() => toggleBulkStudent(s.id)}
                    />
                    {s.profiles?.full_name || "(chưa có tên)"}
                  </label>
                ))}
              </div>
            </label>
            <label>
              Nội dung
              <textarea rows={3} value={bulkText} onChange={(e) => setBulkText(e.target.value)} />
            </label>
            <label>
              Đính kèm ảnh/file (tuỳ chọn)
              <input type="file" onChange={(e) => setBulkFile(e.target.files[0] || null)} />
            </label>
          </div>
          <div className="form-actions">
            <button className="btn-primary" type="submit" disabled={bulkSending}>
              {bulkSending ? "Đang gửi..." : `Gửi tới ${bulkSelectedIds.length} học viên`}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="empty-note">Đang tải...</p>
      ) : (
        <div className="chat-shell">
          <div className="conversation-list">
            {studentList.length === 0 ? (
              <p className="empty-note">Chưa có học viên nào.</p>
            ) : (
              studentList.map((s) => (
                <button
                  key={s.id}
                  className={`conversation-list-item ${selectedStudentId === s.id ? "active" : ""}`}
                  onClick={() => openThread(s.id)}
                >
                  <strong>
                    {s.unread > 0 && <span className="unread-dot" />}
                    {s.full_name}
                  </strong>
                  <span>{s.last ? s.last.body || "(đính kèm file)" : "Chưa có tin nhắn"}</span>
                </button>
              ))
            )}
          </div>

          <div className="chat-thread">
            {!selectedStudentId ? (
              <p className="empty-note" style={{ padding: 16 }}>Chọn 1 học viên bên trái để xem hội thoại.</p>
            ) : (
              <>
                <div className="chat-thread-header">
                  {studentList.find((s) => s.id === selectedStudentId)?.full_name}
                </div>
                <div className="chat-thread-messages">
                  {selectedMessages.length === 0 ? (
                    <p className="empty-note">Chưa có tin nhắn — gửi tin đầu tiên bên dưới.</p>
                  ) : (
                    selectedMessages.map((m) => (
                      <div className={`chat-bubble ${m.sender_role === "admin" ? "mine" : "theirs"}`} key={m.id}>
                        {m.body}
                        {m.attachment_url && (
                          <div>
                            <a onClick={(e) => { e.preventDefault(); handleDownload(m.attachment_url); }} href="#">
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
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
