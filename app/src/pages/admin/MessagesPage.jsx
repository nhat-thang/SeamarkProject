import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function MessagesPage() {
  const { profile } = useAuth();
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [body, setBody] = useState("");
  const [file, setFile] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sentNotice, setSentNotice] = useState("");

  const [sentMessages, setSentMessages] = useState([]);
  const [recipientStats, setRecipientStats] = useState({}); // { messageId: { total, read } }
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStudents();
    loadSentMessages();
  }, []);

  async function loadStudents() {
    const { data, error: loadError } = await supabase
      .from("students")
      .select("id, profiles(full_name)")
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setStudents(data);
  }

  async function loadSentMessages() {
    setLoading(true);
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(30);
    if (msgError) {
      setError(msgError.message);
      setLoading(false);
      return;
    }
    setSentMessages(messages);

    if (messages.length > 0) {
      const { data: recipients } = await supabase
        .from("message_recipients")
        .select("message_id, is_read")
        .in("message_id", messages.map((m) => m.id));

      const stats = {};
      (recipients || []).forEach((r) => {
        if (!stats[r.message_id]) stats[r.message_id] = { total: 0, read: 0 };
        stats[r.message_id].total += 1;
        if (r.is_read) stats[r.message_id].read += 1;
      });
      setRecipientStats(stats);
    }
    setLoading(false);
  }

  function toggleStudent(id) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  function toggleSelectAll() {
    setSelectedIds((prev) => (prev.length === students.length ? [] : students.map((s) => s.id)));
  }

  async function handleDownload(path) {
    const { data, error: signError } = await supabase.storage.from("message-attachments").createSignedUrl(path, 3600);
    if (signError) {
      setError(signError.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleSend(e) {
    e.preventDefault();
    if (selectedIds.length === 0) {
      setError("Vui lòng chọn ít nhất 1 học viên nhận tin.");
      return;
    }
    if (!body.trim() && !file) {
      setError("Vui lòng nhập nội dung hoặc đính kèm file/ảnh.");
      return;
    }
    setError("");
    setSentNotice("");
    setSending(true);

    let attachment_url = null;
    let attachment_type = null;

    if (file) {
      const path = `${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("message-attachments").upload(path, file);
      if (uploadError) {
        setSending(false);
        setError(uploadError.message);
        return;
      }
      attachment_url = path;
      attachment_type = file.type.startsWith("image/") ? "image" : "file";
    }

    const { data: message, error: insertError } = await supabase
      .from("messages")
      .insert({ sender_id: profile?.id, body: body.trim() || null, attachment_url, attachment_type })
      .select()
      .single();

    if (insertError) {
      setSending(false);
      setError(insertError.message);
      return;
    }

    const recipientRows = selectedIds.map((studentId) => ({
      message_id: message.id,
      student_id: studentId,
    }));
    const { error: recipientError } = await supabase.from("message_recipients").insert(recipientRows);

    setSending(false);
    if (recipientError) {
      setError(recipientError.message);
      return;
    }

    setBody("");
    setFile(null);
    setSelectedIds([]);
    setSentNotice(`Đã gửi tới ${recipientRows.length} học viên.`);
    loadSentMessages();
  }

  return (
    <div>
      <div className="page-head">
        <h1>Nhắn tin tới học viên</h1>
      </div>

      {error && <p className="field-error">{error}</p>}
      {sentNotice && <p style={{ color: "var(--navy)", fontWeight: 600 }}>{sentNotice}</p>}

      <form className="form-card" onSubmit={handleSend}>
        <div className="form-grid" style={{ gridTemplateColumns: "1fr" }}>
          <label>
            Người nhận
            <div style={{ border: "1px solid var(--border)", borderRadius: 6, padding: 10, maxHeight: 180, overflowY: "auto" }}>
              <label style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <input
                  type="checkbox"
                  checked={students.length > 0 && selectedIds.length === students.length}
                  onChange={toggleSelectAll}
                />
                Chọn tất cả học viên
              </label>
              {students.length === 0 ? (
                <p className="empty-note" style={{ padding: 0 }}>Chưa có học viên nào.</p>
              ) : (
                students.map((s) => (
                  <label key={s.id} style={{ flexDirection: "row", alignItems: "center", gap: 8, fontWeight: 400 }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={() => toggleStudent(s.id)}
                    />
                    {s.profiles?.full_name || "(chưa có tên)"}
                  </label>
                ))
              )}
            </div>
          </label>

          <label>
            Nội dung
            <textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </label>

          <label>
            Đính kèm ảnh/file (tuỳ chọn)
            <input type="file" onChange={(e) => setFile(e.target.files[0] || null)} />
          </label>
        </div>

        <div className="form-actions">
          <button className="btn-primary" type="submit" disabled={sending}>
            {sending ? "Đang gửi..." : `Gửi tới ${selectedIds.length} học viên`}
          </button>
        </div>
      </form>

      <h2 style={{ fontSize: "1.05rem", color: "var(--navy)" }}>Tin đã gửi</h2>
      {loading ? (
        <p className="empty-note">Đang tải...</p>
      ) : sentMessages.length === 0 ? (
        <p className="empty-note">Chưa gửi tin nào.</p>
      ) : (
        sentMessages.map((m) => {
          const stats = recipientStats[m.id] || { total: 0, read: 0 };
          return (
            <div className="info-card" key={m.id}>
              {m.body && <strong>{m.body}</strong>}
              {m.attachment_url && (
                <div>
                  <button className="btn-link" onClick={() => handleDownload(m.attachment_url)}>
                    Xem đính kèm ({m.attachment_type === "image" ? "ảnh" : "file"})
                  </button>
                </div>
              )}
              <span>
                {new Date(m.created_at).toLocaleString("vi-VN")} · Gửi tới {stats.total} học viên, {stats.read} đã đọc
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
