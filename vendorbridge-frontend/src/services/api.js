import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request Interceptor: Automatically inject access token if it exists in local storage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Optional, e.g., to handle token expiration (403/401) globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If unauthorized/token expired, we can clear token and redirect to login if not already there
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      const isLoginOrSignup = window.location.pathname.includes("/login") || window.location.pathname.includes("/signup");
      if (!isLoginOrSignup) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login?session_expired=true";
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    return response.data;
  },

  register: async (fullName, email, password, confirmPassword, role) => {
    const response = await api.post("/auth/register", {
      fullName,
      email,
      password,
      confirmPassword,
      role,
    });
    return response.data;
  },

  forgotPassword: async (email) => {
    const response = await api.post("/auth/forgot-password", { email });
    return response.data;
  },

  resetPassword: async (token, password, confirmPassword) => {
    const response = await api.post("/auth/reset-password", {
      token,
      password,
      confirmPassword,
    });
    return response.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } catch (err) {
      console.warn("Logout request failed on backend, but clearing client tokens anyway.");
    }
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },
};

export default api;
