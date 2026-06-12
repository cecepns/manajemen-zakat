import { createContext, useContext, useState, useEffect } from "react";
import { get, post } from "@/utils/request";
import { API_ENDPOINTS } from "@/utils/endpoints";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("zakat_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("zakat_token");
    if (!token) { setLoading(false); return; }
    get(API_ENDPOINTS.AUTH.PROFILE)
      .then((res) => setUser(res.data))
      .catch(() => { localStorage.removeItem("zakat_token"); localStorage.removeItem("zakat_user"); setUser(null); })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const res = await post(API_ENDPOINTS.AUTH.LOGIN, { username, password });
    localStorage.setItem("zakat_token", res.data.token);
    localStorage.setItem("zakat_user", JSON.stringify(res.data.user));
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = () => {
    localStorage.removeItem("zakat_token");
    localStorage.removeItem("zakat_user");
    setUser(null);
  };

  const isAdmin = user?.role === "ADMIN" || user?.role === "BENDAHARA";
  const isAmil = user?.role === "AMIL";

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, isAdmin, isAmil }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
