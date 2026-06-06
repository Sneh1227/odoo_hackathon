import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { authService, getApiOrigin } from "../services/api";
import styles from "./Signup.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const allowedRoles = ["Vendor", "Procurement Officer"];

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

const Signup = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      role: "Vendor",
    },
  });

  const passwordVal = watch("password", "");
  const pwdStrength = checkPasswordStrength(passwordVal);
  const strengthDetails = getStrengthDetails(pwdStrength);

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");
    setApiSuccess("");

    try {
      await authService.register(
        data.fullName,
        data.email,
        data.password,
        data.confirmPassword,
        data.role
      );

      setApiSuccess("Registration successful! Redirecting to login page...");
      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setApiError(
        err.response?.data?.message || "Registration failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
<<<<<<< HEAD
    const port = window.location.port || "5173";
    window.location.href = `http://localhost:5000/api/auth/google?from_port=${port}`;
=======
    const origin = encodeURIComponent(window.location.origin);
    window.location.href = `${getApiOrigin()}/api/auth/google?origin=${origin}`;
>>>>>>> 17a1f6c285d6255b0e47764297a5293ce4f6e440
  };

  return (
    <div className={styles.wrapper}>
      <div className={`card shadow-sm ${styles.card}`}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            <h2 className={styles.brandName}>
              <i className="bi bi-shuffle me-2"></i>VendorBridge
            </h2>
            <p className="text-muted">Register ERP User Account</p>
          </div>

          <h3 className={`text-center mb-3 ${styles.heading}`}>Create your account</h3>

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
            {/* Full Name */}
            <div className="mb-3">
              <label htmlFor="fullName" className="form-label">
                Full Name
              </label>
              <input
                type="text"
                className={`form-control ${errors.fullName ? "is-invalid" : ""}`}
                id="fullName"
                placeholder="John Doe"
                {...register("fullName", { required: "Full name is required." })}
              />
              {errors.fullName && (
                <div className="invalid-feedback">{errors.fullName.message}</div>
              )}
            </div>

            {/* Email Address */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                id="email"
                placeholder="you@example.com"
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

            {/* Role Selection */}
            <div className="mb-3">
              <label htmlFor="role" className="form-label">
                Role Selection
              </label>
              <select
                className="form-select"
                id="role"
                {...register("role", { required: "Please select a role." })}
              >
                {allowedRoles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <span className="form-text text-muted small">
                Admin and Manager accounts must be provisioned by an administrator.
              </span>
            </div>

            {/* Password */}
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
            <div className="mb-3">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                className={`form-control ${errors.confirmPassword ? "is-invalid" : ""}`}
                id="confirmPassword"
                placeholder="Re-enter password"
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
              disabled={loading}
            >
              {loading ? (
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
              ) : null}
              {loading ? "Registering..." : "Create Account"}
            </button>



            <p className="text-center mt-3 mb-0">
              Already have an account?{" "}
              <span
                onClick={() => navigate("/login")}
                className={styles.loginLink}
                style={{ cursor: "pointer" }}
              >
                Login
              </span>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
