import { useEffect, useState } from "react";
import { useAuth } from "../../lib/AuthContext";
import { supabase } from "../../lib/supabaseClient";

export default function MaterialsPage() {
  const { profile } = useAuth();
  const [classSections, setClassSections] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadClassSections();
  }, []);

  useEffect(() => {
    if (selectedClassId) loadMaterials(selectedClassId);
    else setMaterials([]);
  }, [selectedClassId]);

  async function loadClassSections() {
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("class_sections")
      .select("id, name")
      .order("name");
    if (loadError) setError(loadError.message);
    else {
      setClassSections(data);
      if (data.length > 0) setSelectedClassId(data[0].id);
    }
    setLoading(false);
  }

  async function loadMaterials(classId) {
    const { data, error: loadError } = await supabase
      .from("materials")
      .select("*")
      .eq("class_section_id", classId)
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else setMaterials(data);
  }

  async function handleUpload(e) {
    e.preventDefault();
    if (!title.trim() || !file) {
      setError("Vui lòng nhập tiêu đề và chọn file.");
      return;
    }
    setError("");
    setUploading(true);

    const path = `${selectedClassId}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("materials").upload(path, file);

    if (uploadError) {
      setUploading(false);
      setError(uploadError.message);
      return;
    }

    const { error: insertError } = await supabase.from("materials").insert({
      class_section_id: selectedClassId,
      title: title.trim(),
      file_url: path,
      uploaded_by: profile?.id,
    });

    setUploading(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    setTitle("");
    setFile(null);
    e.target.reset();
    loadMaterials(selectedClassId);
  }

  async function handleDownload(path) {
    const { data, error: signError } = await supabase.storage.from("materials").createSignedUrl(path, 3600);
    if (signError) {
      setError(signError.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleDelete(material) {
    if (!confirm(`Xoá tài liệu "${material.title}"?`)) return;
    await supabase.storage.from("materials").remove([material.file_url]);
    const { error: deleteError } = await supabase.from("materials").delete().eq("id", material.id);
    if (deleteError) setError(deleteError.message);
    else loadMaterials(selectedClassId);
  }

  return (
    <div>
      <div className="page-head">
        <h1>Tài liệu / bài tập</h1>
      </div>

      {error && <p className="field-error">{error}</p>}

      {loading ? (
        <p className="empty-note">Đang tải...</p>
      ) : classSections.length === 0 ? (
        <p className="empty-note">Chưa có lớp học nào — vào mục "Lớp học" để tạo trước.</p>
      ) : (
        <>
          <div className="form-grid" style={{ maxWidth: 360, marginBottom: 20 }}>
            <label>
              Chọn lớp học
              <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)}>
                {classSections.map((cs) => (
                  <option key={cs.id} value={cs.id}>{cs.name}</option>
                ))}
              </select>
            </label>
          </div>

          <form className="form-card" onSubmit={handleUpload}>
            <div className="form-grid">
              <label>
                Tiêu đề tài liệu
                <input value={title} onChange={(e) => setTitle(e.target.value)} required />
              </label>
              <label>
                Chọn file
                <input type="file" onChange={(e) => setFile(e.target.files[0] || null)} required />
              </label>
            </div>
            <div className="form-actions">
              <button className="btn-primary" type="submit" disabled={uploading}>
                {uploading ? "Đang tải lên..." : "Đăng tài liệu"}
              </button>
            </div>
          </form>

          {materials.length === 0 ? (
            <p className="empty-note">Lớp này chưa có tài liệu nào.</p>
          ) : (
            materials.map((m) => (
              <div className="info-card" key={m.id}>
                <strong>{m.title}</strong>
                <span>{new Date(m.created_at).toLocaleString("vi-VN")}</span>
                <div className="row-actions" style={{ marginTop: 6 }}>
                  <button className="btn-link" onClick={() => handleDownload(m.file_url)}>Tải xuống</button>
                  <button className="btn-link" onClick={() => handleDelete(m)}>Xoá</button>
                </div>
              </div>
            ))
          )}
        </>
      )}
    </div>
  );
}
