import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { authService } from "../services/api";
import styles from "./ResetPassword.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const checkPasswordStrength = (pwd) => {
  let score = 0;
  if (!pwd) return score;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[a-z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return Math.min(score - 1, 4); // Range 0-4
};

const getStrengthDetails = (score) => {
  if (score <= 1) return { label: "Weak", color: "danger" };
  if (score === 2) return { label: "Fair", color: "warning" };
  if (score === 3) return { label: "Good", color: "info" };
  return { label: "Strong", color: "success" };
};

const ResetPassword = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm();

  const passwordVal = watch("password", "");
  const pwdStrength = checkPasswordStrength(passwordVal);
  const strengthDetails = getStrengthDetails(pwdStrength);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    if (!tokenParam) {
      setApiError("Invalid or missing password reset token.");
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const onSubmit = async (data) => {
    if (!token) {
      setApiError("Cannot reset password without a valid token.");
      return;
    }

    setLoading(true);
    setApiError("");
    setApiSuccess("");

    try {
      await authService.resetPassword(token, data.password, data.confirmPassword);
      setApiSuccess("Password updated successfully! Redirecting to login page...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Failed to reset password. The link may have expired."
      );
    } finally {
      setLoading(false);
    }
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

          <h3 className={`text-center mb-3 ${styles.heading}`}>Reset Password</h3>
          <p className="text-muted text-center small mb-4">
            Enter your new secure password below to regain access to your account.
          </p>

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
            {/* New Password */}
            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                New Password
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? "text" : "password"}
                  className={`form-control ${errors.password ? "is-invalid" : ""}`}
                  id="password"
                  placeholder="Enter new password"
                  disabled={!token}
                  {...register("password", {
                    required: "Password is required.",
                    minLength: {
                      value: 8,
                      message: "Password must be at least 8 characters long.",
                    },
                    validate: {
                      uppercase: (v) => /[A-Z]/.test(v) || "Must contain at least one uppercase letter.",
                      lowercase: (v) => /[a-z]/.test(v) || "Must contain at least one lowercase letter.",
                      number: (v) => /[0-9]/.test(v) || "Must contain at least one digit.",
                      special: (v) => /[^A-Za-z0-9]/.test(v) || "Must contain at least one special character.",
                    },
                  })}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  disabled={!token}
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`} />
                </button>
                {errors.password && (
                  <div className="invalid-feedback d-block">{errors.password.message}</div>
                )}
              </div>

              {/* Real-time Password Strength Indicator */}
              {passwordVal && (
                <div className="mt-2">
                  <div className="d-flex align-items-center mb-1">
                    <small className="me-2 text-muted">Password Strength:</small>
                    <span className={`text-${strengthDetails.color} fw-bold small`}>
                      {strengthDetails.label}
                    </span>
                  </div>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles[`strength-${pwdStrength}`]}
                      style={{ width: `${(pwdStrength / 4) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="mb-4">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                id="confirmPassword"
                placeholder="Re-enter new password"
                disabled={!token}
                {...register("confirmPassword", {
                  required: "Please confirm your password.",
                  validate: (val) => val === watch("password") || "Passwords do not match.",
                })}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword.message}</div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="btn btn-primary w-100 mb-3"
              disabled={loading || !token}
            >
              {loading ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : null}
              {loading ? "Updating password..." : "Reset Password"}
            </button>

            <div className="text-center">
              <span
                onClick={() => navigate("/login")}
                className={styles.loginLink}
                style={{ cursor: "pointer" }}
              >
                Cancel and Login
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
