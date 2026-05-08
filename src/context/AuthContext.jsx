import { createContext, useContext, useEffect, useMemo, useState } from "react";

import api from "../services/api";
import { logout } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem("access_token");

    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get("/usuarios/me/")
      .then(({ data }) => setUser(data))
      .catch(() => {
        sessionStorage.clear();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function signOut() {
    logout();
    setUser(null);
  }

  const value = useMemo(
    () => ({
      user,
      setUser,
      signOut,
      loading,
    }),
    [loading, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
}
