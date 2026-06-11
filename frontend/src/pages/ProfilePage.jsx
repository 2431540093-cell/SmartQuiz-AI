import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import Layout from "../components/Layout";

export default function ProfilePage() {
  const { authFetch, user, logout } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authFetch("/profile/stats")
      .then(r => r.json())
      .then(setStats)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout title="👤 Hồ sơ">
      <div className="text-center" style={{ padding: 60 }}><span className="spinner spinner-dark" /></div>
    </Layout>
  );

  return (
    <Layout title="👤 Hồ sơ">
      <div style={{ maxWidth: 600 }}>
        {/* User info card */}
        <div className="card" style={{ marginBottom: 20, display: "flex", gap: 24, alignItems: "center" }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%",
            background: "var(--primary-light)", color: "var(--primary)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, fontWeight: 800, flexShrink: 0,
          }}>
            {user?.username?.[0]?.toUpperCase()}
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800 }}>{user?.username}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 2 }}>{user?.email}</div>
            <div style={{ color: "var(--text-muted)", fontSize: 12, marginTop: 4 }}>
              Tham gia: {user?.created_at ? new Date(user.created_at).toLocaleDateString("vi-VN") : "—"}
            </div>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="stats-grid" style={{ marginBottom: 20 }}>
            <div className="stat-card">
              <div className="stat-label">Tài liệu</div>
              <div className="stat-value">{stats.doc_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Bài quiz</div>
              <div className="stat-value">{stats.quiz_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Lượt hỏi AI</div>
              <div className="stat-value">{stats.chat_count}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Điểm TB</div>
              <div className="stat-value">{stats.avg_score}%</div>
            </div>
          </div>
        )}

        {/* Progress bar */}
        {stats && stats.quiz_count > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div className="card-title">📈 Tiến độ học tập</div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 6 }}>
                <span>Điểm trung bình</span>
                <strong>{stats.avg_score}%</strong>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{
                  width: `${stats.avg_score}%`,
                  background: stats.avg_score >= 80 ? "var(--success)" : stats.avg_score >= 50 ? "var(--warning)" : "var(--danger)"
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="card">
          <div className="card-title">⚙️ Tài khoản</div>
          <button className="btn btn-danger" onClick={() => { if (confirm("Đăng xuất?")) logout(); }}>
            🚪 Đăng xuất
          </button>
        </div>
      </div>
    </Layout>
  );
}
