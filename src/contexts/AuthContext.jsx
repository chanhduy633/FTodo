import React, { createContext, useContext, useState, useEffect } from "react";
import api from "@/lib/axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        // Verify token and set user
        api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

        try {
          // Fetch full user profile including avatar
          const response = await api.get("/auth/profile");
          setUser(response.data.user);
        } catch (error) {
          console.error("Failed to fetch user profile:", error);
          // If profile fetch fails, clear token
          localStorage.removeItem("token");
          delete api.defaults.headers.common["Authorization"];
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token, user: userData } = response.data;
      localStorage.setItem("token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;

      // Fetch full user profile including avatar
      const profileResponse = await api.get("/auth/profile");
      setUser(profileResponse.data.user);

      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  const register = async (username, email, password) => {
    try {
      const response = await api.post("/auth/register", { username, email, password });
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || "Registration failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    delete api.defaults.headers.common["Authorization"];
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const response = await api.get("/auth/profile");
      setUser(response.data.user);
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      // If refresh fails, logout user
      logout();
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    refreshUser,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
