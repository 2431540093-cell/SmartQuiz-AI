import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";

export default function ChatPage() {
  const { authFetch } = useAuth();
  const [searchParams] = useSearchParams();
  const [docs, setDocs]             = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [messages, setMessages]     = useState([]);
  const [input, setInput]           = useState("");
  const [loading, setLoading]       = useState(false);
  const bottomRef = useRef();

  useEffect(() => {
    authFetch("/documents").then(r => r.json()).then(d => {
      setDocs(d);
      const docId = parseInt(searchParams.get("doc"));
      if (docId && d.find(x => x.id === docId)) setSelectedDoc(docId);
      else if (d.length > 0) setSelectedDoc(d[0].id);
    });
  }, []);

  useEffect(() => {
    if (selectedDoc) loadHistory(selectedDoc);
    else setMessages([]);
  }, [selectedDoc]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadHistory = (docId) => {
    authFetch(`/chat-history?document_id=${docId}`).then(r => r.json()).then(data => {
      const msgs = [];
      data.forEach(h => {
        msgs.push({ role: "user", text: h.question });
        msgs.push({ role: "ai",   text: h.answer });
      });
      setMessages(msgs);
    });
  };

  const sendMessage = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);
    try {
      const res = await authFetch("/ask-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q, document_id: selectedDoc }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "ai", text: data.answer || data.error || "Lỗi không xác định" }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "⚠️ Lỗi kết nối server" }]);
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!selectedDoc || !confirm("Xóa toàn bộ lịch sử chat?")) return;
    await authFetch("/chat-history?document_id=" + selectedDoc, { method: "DELETE" });
    setMessages([]);
  };

  const handleKeyDown = e => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const selectedDocName = docs.find(d => d.id === selectedDoc)?.original_name || "";

  return (
    <div className="layout">
      <Sidebar />
      <div className="main" style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <div className="page-header">
          <h1>💬 Chat AI</h1>
          <div className="flex gap-2 items-center">
            {selectedDocName && <span className="text-sm text-muted">📄 {selectedDocName}</span>}
            {messages.length > 0 && (
              <button className="btn btn-ghost btn-sm" onClick={clearHistory}>🗑 Xóa lịch sử</button>
            )}
          </div>
        </div>

        <div className="chat-layout" style={{ flex: 1, overflow: "hidden" }}>
          {/* Document sidebar */}
          <div className="chat-sidebar">
            <div className="chat-sidebar-header">
              <div className="chat-sidebar-title">📚 Tài liệu</div>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
              {docs.length === 0 ? (
                <div style={{ padding: "16px", fontSize: 13, color: "var(--text-muted)" }}>
                  Chưa có tài liệu
                </div>
              ) : docs.map(doc => (
                <div key={doc.id}
                  className={"chat-doc-item" + (selectedDoc === doc.id ? " active" : "")}
                  onClick={() => setSelectedDoc(doc.id)}
                  title={doc.original_name}
                >
                  📄 {doc.original_name}
                </div>
              ))}
            </div>
          </div>

          {/* Chat area */}
          <div className="chat-main">
            <div className="chat-messages">
              {messages.length === 0 && !loading && (
                <div className="empty-state">
                  <div className="empty-icon">🤖</div>
                  <p>Chọn tài liệu và đặt câu hỏi để bắt đầu</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={"msg " + msg.role}>
                  <div className="msg-avatar">{msg.role === "ai" ? "🤖" : "👤"}</div>
                  <div className="msg-bubble">{msg.text}</div>
                </div>
              ))}
              {loading && (
                <div className="msg ai">
                  <div className="msg-avatar">🤖</div>
                  <div className="msg-bubble" style={{ color: "var(--text-muted)" }}>
                    <span className="spinner spinner-dark" style={{ marginRight: 8 }} />
                    Đang suy nghĩ...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="chat-input-area">
              <textarea
                className="form-control"
                placeholder={selectedDoc ? "Đặt câu hỏi về tài liệu... (Enter để gửi)" : "Hãy chọn tài liệu trước"}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={2}
                disabled={!selectedDoc || loading}
              />
              <button className="btn btn-primary" onClick={sendMessage}
                disabled={!input.trim() || !selectedDoc || loading} style={{ alignSelf: "flex-end" }}>
                {loading ? <span className="spinner" /> : "Gửi ➤"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
