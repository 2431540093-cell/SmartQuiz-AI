import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

export default function ResultsPage() {
  const { authFetch } = useAuth();
  const navigate = useNavigate();
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState(null); // detail view
  const [detail, setDetail]     = useState(null);

  useEffect(() => {
    authFetch("/quiz-results")
      .then(r => r.json())
      .then(setResults)
      .finally(() => setLoading(false));
  }, []);

  const loadDetail = async (id) => {
    if (selected === id) { setSelected(null); setDetail(null); return; }
    setSelected(id);
    const res = await authFetch(`/quiz-results/${id}`);
    const data = await res.json();
    setDetail(data);
  };

  const badgeClass = (pct) =>
    pct >= 80 ? "badge badge-success" : pct >= 50 ? "badge badge-warning" : "badge badge-danger";

  return (
    <Layout title="📊 Kết quả Quiz">
      {loading ? (
        <div className="text-center" style={{ padding: 60 }}>
          <span className="spinner spinner-dark" />
        </div>
      ) : results.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <p>Chưa có kết quả nào.</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => navigate("/quiz")}>
            Làm quiz ngay
          </button>
        </div>
      ) : (
        <>
          <div className="stats-grid" style={{ marginBottom: 24 }}>
            <div className="stat-card">
              <div className="stat-label">Tổng lần làm</div>
              <div className="stat-value">{results.length}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Điểm TB (%)</div>
              <div className="stat-value">
                {results.length
                  ? Math.round(results.reduce((a, r) => a + r.percentage, 0) / results.length)
                  : 0}%
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Điểm cao nhất</div>
              <div className="stat-value">
                {results.length ? Math.max(...results.map(r => r.percentage)) : 0}%
              </div>
            </div>
          </div>

          <table className="results-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Tài liệu</th>
                <th>Điểm</th>
                <th>%</th>
                <th>Thời gian</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <>
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.document_name || <em className="text-muted">Nhập thủ công</em>}</td>
                    <td><strong>{r.score}/{r.total}</strong></td>
                    <td><span className={badgeClass(r.percentage)}>{r.percentage}%</span></td>
                    <td>{new Date(r.created_at).toLocaleString("vi-VN")}</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => loadDetail(r.id)}>
                        {selected === r.id ? "▲ Đóng" : "▼ Xem"}
                      </button>
                    </td>
                  </tr>
                  {selected === r.id && detail && (
                    <tr key={r.id + "_detail"}>
                      <td colSpan={6} style={{ background: "var(--bg)", padding: 0 }}>
                        <div style={{ padding: "20px 24px" }}>
                          {detail.questions?.map((q, qi) => {
                            const userAns = detail.answers?.[qi];
                            const correct = userAns === q.answer;
                            return (
                              <div key={qi} style={{
                                marginBottom: 14, padding: "14px 18px",
                                background: "white", borderRadius: 8,
                                border: `1.5px solid ${correct ? "var(--success)" : "var(--danger)"}`,
                              }}>
                                <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6 }}>
                                  {correct ? "✅" : "❌"} {qi + 1}. {q.question}
                                </div>
                                <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
                                  Bạn chọn: <strong>{userAns || "Chưa trả lời"}</strong>
                                  {!correct && <> · Đáp án đúng: <strong style={{ color: "var(--success)" }}>{q.answer}</strong></>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </>
      )}
    </Layout>
  );
}
