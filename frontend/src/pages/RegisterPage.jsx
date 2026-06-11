import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth, API } from "../context/AuthContext";

export default function RegisterPage() {
  const { login } = useAuth();
  const navigate  = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirm) { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Đăng ký thất bại"); return; }
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
          <p>Tạo tài khoản mới</p>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tên người dùng</label>
            <input className="form-control" name="username" value={form.username}
              onChange={handleChange} placeholder="Nguyễn Văn A" required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="form-control" type="email" name="email" value={form.email}
              onChange={handleChange} placeholder="example@email.com" required />
          </div>
          <div className="form-group">
            <label>Mật khẩu</label>
            <input className="form-control" type="password" name="password" value={form.password}
              onChange={handleChange} placeholder="Tối thiểu 6 ký tự" required />
          </div>
          <div className="form-group">
            <label>Xác nhận mật khẩu</label>
            <input className="form-control" type="password" name="confirm" value={form.confirm}
              onChange={handleChange} placeholder="••••••••" required />
          </div>
          {error && <div className="error-msg mb-4">{error}</div>}
          <button className="btn btn-primary btn-full" type="submit" disabled={loading}>
            {loading ? <span className="spinner" /> : "Đăng ký"}
          </button>
        </form>
        <p className="text-center text-sm mt-4" style={{ color: "var(--text-muted)" }}>
          Đã có tài khoản?{" "}
          <Link to="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Đăng nhập</Link>
        </p>
      </div>
    </div>
  );
}
