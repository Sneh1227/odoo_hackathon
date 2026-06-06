import React, { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService, getApiOrigin } from "../services/api";
import { useAuth } from "../context/AuthContext";
import styles from "./Login.module.css";

const Login = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading, user, getDashboardPath, refreshUser } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const googleHandledRef = useRef(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role && !searchParams.get("token")) {
      navigate(getDashboardPath(user.role), { replace: true });
    }
  }, [isAuthenticated, isLoading, user, navigate, getDashboardPath, searchParams]);

  useEffect(() => {
    const existingToken = localStorage.getItem("token");
    const existingUserJson = localStorage.getItem("user");
    const sessionExpired = searchParams.get("session_expired");

    if (existingToken && existingUserJson && !sessionExpired) {
      try {
        const u = JSON.parse(existingUserJson);
        if (u && u.role) {
          navigate(getDashboardPath(u.role), { replace: true });
          return;
        }
      } catch (e) {
        console.error("Error parsing logged in user", e);
      }
    }

    const token = searchParams.get("token");
    const role = searchParams.get("role");
    const errorParam = searchParams.get("error");

    if (sessionExpired) {
      setApiError("Your session has expired. Please log in again.");
    }

    if (errorParam) {
      if (errorParam === "UserNotRegistered") {
        setApiError("Your email is not registered with us. Please register first.");
      } else {
        setApiError("Authentication with Google failed. Please try again.");
      }
      return;
    }

    if (!token || !role || googleHandledRef.current) {
      return;
    }

    googleHandledRef.current = true;

    const completeGoogleLogin = async () => {
      setLoading(true);
      setApiError("");

      try {
        const fullName = searchParams.get("fullName") || "";
        const profilePicture = searchParams.get("profilePicture") || "";
        const email = searchParams.get("email") || "";
        const id = searchParams.get("id");

        login(token, {
          id: id ? Number(id) : undefined,
          role,
          fullName,
          profilePicture,
          email,
        });

        const profile = await refreshUser();
        const dashboardRole = profile?.role || role;
        navigate(getDashboardPath(dashboardRole), { replace: true });
      } catch (err) {
        console.error("[Login] Google callback error:", err);
        setApiError(
          err.response?.data?.message ||
            "Google sign-in succeeded but session setup failed. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    completeGoogleLogin();
  }, [searchParams, login, navigate, getDashboardPath, refreshUser]);

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");
    setApiSuccess("");

    try {
      const response = await authService.login(data.email, data.password);
      login(response.token, response.user);
      await refreshUser();
      setApiSuccess("Welcome back! Redirecting...");

      setTimeout(() => {
        navigate(getDashboardPath(response.user.role), { replace: true });
      }, 500);
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Invalid credentials. Please verify and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const origin = encodeURIComponent(window.location.origin);
    window.location.href = `${getApiOrigin()}/api/auth/google?origin=${origin}`;
  };

  return (
    <div className={styles.wrapper}>
      <div className={`card shadow-sm ${styles.card}`}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h2 className={styles.brandName}>
              <i className="bi bi-shuffle me-2"></i>VendorBridge
            </h2>
            <p className="text-muted">Procurement ERP Portal</p>
          </div>

          <h3 className={`text-center mb-3 ${styles.heading}`}>Welcome back</h3>

          {apiError && (
            <div className="alert alert-danger p-2 text-center small" role="alert">
              {apiError}
            </div>
          )}

          {apiSuccess && (
            <div className="alert alert-success p-2 text-center small" role="alert">
              {apiSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                id="email"
                placeholder="you@example.com"
                disabled={loading}
                {...register("email", {
                  required: "Email is required.",
                  pattern: {
                    value: /^[^@\s]+@[^@\s]+\.[^@\s]+$/,
                    message: "Please enter a valid email address.",
                  },
                })}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email.message}</div>
              )}
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  id="password"
                  placeholder="Enter password"
                  disabled={loading}
                  {...register("password", {
                    required: "Password is required.",
                  })}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
                </button>
                {errors.password && (
                  <div className="invalid-feedback d-block">{errors.password.message}</div>
                )}
              </div>
            </div>

            <div className="d-flex justify-content-between align-items-center mb-3">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="remember"
                  {...register("remember")}
                />
                <label className="form-check-label" htmlFor="remember">
                  Remember me
                </label>
              </div>
              <span
                onClick={() => navigate("/forgot-password")}
                className={styles.forgotLink}
                style={{ cursor: "pointer" }}
              >
                Forgot Password?
              </span>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={loading}
            >
              {loading ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : null}
              {loading ? "Logging in..." : "Login"}
            </button>

            <div className="d-flex align-items-center my-3">
              <hr className="flex-grow-1" />
              <span className="mx-2 text-muted small text-uppercase">or</span>
              <hr className="flex-grow-1" />
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
              disabled={loading}
            >
              <i className="bi bi-google me-2"></i>
              Continue with Google
            </button>

            <p className="text-center mt-3 mb-0">
              Don't have an account?{" "}
              <span
                onClick={() => navigate("/signup")}
                className={styles.signUpLink}
                style={{ cursor: "pointer" }}
              >
                Sign Up
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
