import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/, "");

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

export const getApiOrigin = () => API_ORIGIN;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const isAuthFailure = (error) => {
  const status = error.response?.status;
  const message = (error.response?.data?.message || "").toLowerCase();
  const requestUrl = error.config?.url || "";

  if (status === 403) {
    return true;
  }

  if (status === 401) {
    if (requestUrl.includes("/profile/change-password")) {
      return false;
    }
    return (
      message.includes("token") ||
      message.includes("expired") ||
      message.includes("missing") ||
      message.includes("unauthorized") ||
      message.includes("access")
    );
  }

  return false;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && isAuthFailure(error)) {
      const isPublicAuthPage =
        window.location.pathname.includes("/login") ||
        window.location.pathname.includes("/signup") ||
        window.location.pathname.includes("/forgot-password") ||
        window.location.pathname.includes("/reset-password");

      if (!isPublicAuthPage) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        if (typeof onUnauthorized === "function") {
          onUnauthorized();
        } else {
          window.location.href = "/login?session_expired=true";
        }
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

  approveVendor: async (id, action, remarks) => {
    const response = await api.put(`/auth/approve-vendor/${id}`, { action, remarks });
    return response.data;
  },

  resetPasswordByToken: async (token, password, confirmPassword) => {
    const response = await api.post(`/auth/reset-password/${token}`, {
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

export const dashboardService = {
  getAdminData: async () => {
    const response = await api.get("/dashboard/admin");
    return response.data;
  },
  getVendorData: async () => {
    const response = await api.get("/dashboard/vendor");
    return response.data;
  },
  getProcurementData: async () => {
    const response = await api.get("/dashboard/procurement");
    return response.data;
  },
  getManagerData: async () => {
    const response = await api.get("/dashboard/manager");
    return response.data;
  },
  getActivityLogs: async () => {
    const response = await api.get("/dashboard/logs");
    return response.data;
  },
  handleApproval: async (id, action, remarks) => {
    const response = await api.put(`/dashboard/approval/${id}`, { action, remarks });
    return response.data;
  },
  getRfqDetails: async (id) => {
    const response = await api.get(`/dashboard/rfq/${id}`);
    return response.data;
  },
  submitQuotation: async (data) => {
    const response = await api.post("/dashboard/quotation", data);
    return response.data;
  }
};

export const profileService = {
  getProfile: async () => {
    const response = await api.get("/profile");
    return response.data;
  },

  updateProfile: async ({ fullName, profilePicture }) => {
    const response = await api.put("/profile", { fullName, profilePicture });
    return response.data;
  },

  changePassword: async ({ currentPassword, newPassword, confirmPassword }) => {
    const response = await api.put("/profile/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
    });
    return response.data;
  },
};

export default api;
