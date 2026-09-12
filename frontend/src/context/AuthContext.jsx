import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api.js";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.get("/auth/me")
        .then((data) => setUser(data))
        .catch(() => {
          localStorage.removeItem("token");
          setToken(null);
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const data = await api.login(email, password);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const data = await api.register(name, email, password);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const joinAsGuest = async (name) => {
    const data = await api.joinAsGuest(name);
    localStorage.setItem("token", data.access_token);
    setToken(data.access_token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, joinAsGuest, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
