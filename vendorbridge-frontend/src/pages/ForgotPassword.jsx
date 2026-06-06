import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/api";
import styles from "./ForgotPassword.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [apiSuccess, setApiSuccess] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    setApiError("");
    setApiSuccess("");

    try {
      await authService.forgotPassword(data.email);
      setApiSuccess(
        "If the email exists, a password reset link has been dispatched to it."
      );
    } catch (err) {
      setApiError(
        err.response?.data?.message || "An error occurred. Please try again."
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

          <h3 className={`text-center mb-3 ${styles.heading}`}>Forgot Password</h3>
          <p className="text-muted text-center small mb-4">
            Enter your email address below and we'll send you a link to reset your password.
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
            {/* Email Field */}
            <div className="mb-4">
              <label htmlFor="email" className="form-label">
                Email Address
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
              {loading ? "Sending link..." : "Send Reset Link"}
            </button>

            <div className="text-center">
              <span
                onClick={() => navigate("/login")}
                className={styles.loginLink}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-arrow-left me-1"></i>Back to Login
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
