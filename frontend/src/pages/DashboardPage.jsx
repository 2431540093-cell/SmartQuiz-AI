import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

export default function DashboardPage() {
  const { authFetch, user } = useAuth();
  const navigate = useNavigate();
  const [docs, setDocs]         = useState([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging]   = useState(false);
  const [msg, setMsg]   = useState(null); // {type, text}
  const fileRef = useRef();

  const loadDocs = () => {
    authFetch("/documents").then(r => r.json()).then(setDocs).catch(console.error);
  };

  useEffect(() => { loadDocs(); }, []);

  const uploadFile = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith(".pdf")) {
      setMsg({ type: "error", text: "Chỉ chấp nhận file PDF" });
      return;
    }
    setUploading(true);
    setMsg(null);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await authFetch("/upload-pdf", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) { setMsg({ type: "error", text: data.error }); return; }
      setMsg({ type: "success", text: `✅ Đã tải lên "${data.document.original_name}" (${data.chunks} chunks)` });
      loadDocs();
    } catch {
      setMsg({ type: "error", text: "Lỗi kết nối server" });
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (id, name) => {
    if (!confirm(`Xóa tài liệu "${name}"?`)) return;
    await authFetch(`/documents/${id}`, { method: "DELETE" });
    setDocs(docs.filter(d => d.id !== id));
  };

  const handleDrop = e => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) uploadFile(file);
  };

  return (
    <Layout title="Dashboard">
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Tài liệu</div>
          <div className="stat-value">{docs.length}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Chào mừng</div>
          <div className="stat-value" style={{ fontSize: 18, marginTop: 8 }}>{user?.username} 👋</div>
        </div>
      </div>

      {/* Upload zone */}
      <div className="card mb-4" style={{ marginBottom: 20 }}>
        <div className="card-title">📤 Tải lên tài liệu PDF</div>
        <div
          className={`upload-zone${dragging ? " dragging" : ""}`}
          onClick={() => fileRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
        >
          <div className="upload-icon">{uploading ? "⏳" : "📄"}</div>
          <div className="upload-text">
            {uploading ? "Đang xử lý..." : "Kéo thả hoặc click để chọn file"}
          </div>
          <div className="upload-hint">Chỉ chấp nhận file .pdf</div>
        </div>
        <input ref={fileRef} type="file" accept=".pdf" style={{ display: "none" }}
          onChange={e => uploadFile(e.target.files[0])} />
        {msg && (
          <div className={`${msg.type === "error" ? "error-msg" : "success-msg"} mt-4`} style={{ marginTop: 12 }}>
            {msg.text}
          </div>
        )}
      </div>

      {/* Document list */}
      <div className="card">
        <div className="card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>📚 Tài liệu của tôi ({docs.length})</span>
        </div>
        {docs.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📂</div>
            <p>Chưa có tài liệu nào. Hãy tải lên PDF đầu tiên!</p>
          </div>
        ) : (
          <div className="doc-list">
            {docs.map(doc => (
              <div key={doc.id} className="doc-item">
                <div className="doc-icon">📄</div>
                <div className="doc-info">
                  <div className="doc-name">{doc.original_name}</div>
                  <div className="doc-date">{new Date(doc.uploaded_at).toLocaleString("vi-VN")}</div>
                </div>
                <div className="doc-actions">
                  <button className="btn btn-outline btn-sm"
                    onClick={() => navigate(`/chat?doc=${doc.id}`)}>Chat</button>
                  <button className="btn btn-primary btn-sm"
                    onClick={() => navigate(`/quiz?doc=${doc.id}`)}>Quiz</button>
                  <button className="btn btn-danger btn-sm"
                    onClick={() => deleteDoc(doc.id, doc.original_name)}>🗑</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
