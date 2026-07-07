import { createContext, useContext, useState, useEffect } from "react";
import { apiRequest, setAccessToken, setOnLogout } from "../utils/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const login = (token, userData) => {
    setAccessToken(token);
    setUser(userData);
  };

  const logout = () => {
    setAccessToken(null);
    setUser(null);
    localStorage.removeItem("accessToken");
  };

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        try {
          const result = await apiRequest("/api/users/current");
          if (result.status) {
            setUser(result.data);
          }
        } catch (error) {
          console.error("Gagal memuat profil pengguna:", error);
          setAccessToken(null);
        }
      }
      setAuthLoading(false);
    };

    fetchProfile();

    setOnLogout(() => {
      logout();
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, authLoading, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
