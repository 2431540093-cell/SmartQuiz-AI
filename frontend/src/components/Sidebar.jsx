import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/dashboard", icon: "🏠", label: "Dashboard" },
  { to: "/chat",      icon: "💬", label: "Chat AI" },
  { to: "/quiz",      icon: "📝", label: "Làm bài Quiz" },
  { to: "/results",   icon: "📊", label: "Kết quả" },
  { to: "/profile",   icon: "👤", label: "Hồ sơ" },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <span>🧠</span> SmartQuiz AI
      </div>
      <nav className="sidebar-nav">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div style={{ fontSize: 13, color: "var(--text-muted)", marginBottom: 10, padding: "0 4px" }}>
          <div style={{ fontWeight: 600, color: "var(--text)" }}>{user?.username}</div>
          <div style={{ fontSize: 12 }}>{user?.email}</div>
        </div>
        <button className="btn btn-ghost btn-full btn-sm" onClick={handleLogout}>
          🚪 Đăng xuất
        </button>
      </div>
    </div>
  );
}
