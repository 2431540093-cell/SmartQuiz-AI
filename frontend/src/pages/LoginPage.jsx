import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Đăng nhập thất bại"); return; }
      login(data.token, data.user);
      navigate("/dashboard");
    } catch {
      setError("Không thể kết nối server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>🧠 SmartQuiz AI</h1>
          <p>Hệ thống học tập thông minh</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="example@email.com" required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input className="form-control" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="••••••••" required />
          </div>
          {error && <div className="error-msg mb-4">{error}</div>}
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Đăng nhập"}
          </button>
        </form>
        <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          Chưa có tài khoản?{" "}
          <Link to="/register" style={{ color: "var(--primary)", fontWeight: 600 }}>Đăng ký</Link>
        </p>
      </div>
    </div>
  );
}
