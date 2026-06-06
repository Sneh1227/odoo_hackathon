import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authService, profileService, setUnauthorizedHandler } from "../services/api";

const AuthContext = createContext(null);

const parseJwt = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join("")
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

const isTokenExpired = (token) => {
  const decoded = parseJwt(token);
  if (!decoded || !decoded.exp) {
    return true;
  }
  return decoded.exp * 1000 <= Date.now();
};

const getDashboardPath = (role) => {
  switch (role) {
    case "Admin":
      return "/admin/dashboard";
    case "Vendor":
      return "/vendor/dashboard";
    case "Procurement Officer":
      return "/procurement/dashboard";
    case "Manager":
      return "/manager/dashboard";
    default:
      return "/login";
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionMessage, setSessionMessage] = useState("");
  const expiryTimerRef = useRef(null);

  const clearSession = useCallback((message = "") => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
    if (message) {
      setSessionMessage(message);
    }
    if (expiryTimerRef.current) {
      clearTimeout(expiryTimerRef.current);
      expiryTimerRef.current = null;
    }
  }, []);

  const scheduleTokenExpiry = useCallback(
    (accessToken) => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }

      const decoded = parseJwt(accessToken);
      if (!decoded?.exp) {
        return;
      }

      const msUntilExpiry = decoded.exp * 1000 - Date.now();
      if (msUntilExpiry <= 0) {
        clearSession("Your session has expired. Please log in again.");
        return;
      }

      expiryTimerRef.current = setTimeout(() => {
        clearSession("Your session has expired. Please log in again.");
        window.location.href = "/login?session_expired=true";
      }, msUntilExpiry);
    },
    [clearSession]
  );

  const persistSession = useCallback(
    (accessToken, userData) => {
      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(userData));
      setToken(accessToken);
      setUser(userData);
      scheduleTokenExpiry(accessToken);
    },
    [scheduleTokenExpiry]
  );

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem("token");
    if (!storedToken || isTokenExpired(storedToken)) {
      clearSession();
      return null;
    }

    try {
      const response = await profileService.getProfile();
      const profileUser = response.user;
      persistSession(storedToken, profileUser);
      return profileUser;
    } catch (error) {
      console.error("[AuthContext] Failed to refresh user profile:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        clearSession("Your session has expired. Please log in again.");
      }
      return null;
    }
  }, [clearSession, persistSession]);

  const login = useCallback(
    (accessToken, userData) => {
      setSessionMessage("");
      persistSession(accessToken, userData);
    },
    [persistSession]
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.warn("[AuthContext] Logout request failed:", error);
    } finally {
      clearSession();
    }
  }, [clearSession]);

  const handleUnauthorized = useCallback(() => {
    clearSession("Your session has expired. Please log in again.");
    if (!window.location.pathname.includes("/login")) {
      window.location.href = "/login?session_expired=true";
    }
  }, [clearSession]);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem("token");
      const storedUserJson = localStorage.getItem("user");

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      if (isTokenExpired(storedToken)) {
        clearSession("Your session has expired. Please log in again.");
        setIsLoading(false);
        return;
      }

      setToken(storedToken);
      scheduleTokenExpiry(storedToken);

      if (storedUserJson) {
        try {
          setUser(JSON.parse(storedUserJson));
        } catch (error) {
          console.error("[AuthContext] Failed to parse stored user:", error);
        }
      }

      await refreshUser();
      setIsLoading(false);
    };

    initializeAuth();

    return () => {
      if (expiryTimerRef.current) {
        clearTimeout(expiryTimerRef.current);
      }
    };
  }, [clearSession, handleUnauthorized, refreshUser, scheduleTokenExpiry]);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(token && user),
    isLoading,
    sessionMessage,
    login,
    logout,
    refreshUser,
    getDashboardPath,
    clearSessionMessage: () => setSessionMessage(""),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export default AuthContext;
