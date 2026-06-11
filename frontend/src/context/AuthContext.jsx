import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);
export const API = "";  // Proxied via vite dev server

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(() => localStorage.getItem("sq_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.json() : Promise.reject())
        .then(d => setUser(d.user))
        .catch(() => logout())
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = (newToken, userData) => {
    localStorage.setItem("sq_token", newToken);
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("sq_token");
    setToken(null);
    setUser(null);
  };

  const authFetch = (url, options = {}) => {
    const storedToken = localStorage.getItem("sq_token");
    return fetch(`${API}${url}`, {
      ...options,
      headers: {
        ...(options.headers || {}),
        Authorization: `Bearer ${storedToken}`,
      },
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, authFetch }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
