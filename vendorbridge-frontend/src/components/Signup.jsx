// src/components/Signup.jsx
import React, { useState } from "react";
import styles from "./Signup.module.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const roles = [
  "Procurement Officer",
  "Vendor",
  "Manager",
  "Admin",
];

const passwordStrength = (pwd) => {
  // Simple strength check: length + patterns
  let score = 0;
  if (pwd.length >= 8) score += 1;
  if (/[A-Z]/.test(pwd)) score += 1;
  if (/[0-9]/.test(pwd)) score += 1;
  if (/[^A-Za-z0-9]/.test(pwd)) score += 1;
  return score; // 0-4
};

const strengthLabel = (score) => {
  switch (score) {
    case 0:
    case 1:
      return { text: "Weak", color: "danger" };
    case 2:
      return { text: "Fair", color: "warning" };
    case 3:
      return { text: "Good", color: "info" };
    case 4:
      return { text: "Strong", color: "success" };
    default:
      return { text: "", color: "" };
  }
};

const Signup = () => {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(roles[0]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!fullName) newErrors.fullName = "Full name is required.";
    if (!email) {
      newErrors.email = "Email address is required.";
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      newErrors.email = "Enter a valid email address.";
    }
    if (!password) newErrors.password = "Password is required.";
    if (!confirmPassword) newErrors.confirmPassword = "Please confirm your password.";
    if (password && confirmPassword && password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    // Simulate async registration
    await new Promise((res) => setTimeout(res, 1500));
    setLoading(false);
    console.log("Account created", { fullName, email, role });
  };

  const strengthScore = passwordStrength(password);
  const { text: strengthText, color: strengthColor } = strengthLabel(strengthScore);

  return (
    <div className={styles.wrapper}>
      <div className={`card shadow-sm ${styles.card}`}>
        <div className="card-body p-4">
          <div className="text-center mb-4">
            {/* Replace src with actual logo path */}
            <img src="/logo.png" alt="VendorBridge" className={styles.logo} />
          </div>
          <h3 className={`text-center mb-4 ${styles.heading}`}>Create your account</h3>
          <form onSubmit={handleSubmit} noValidate>
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
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
              {errors.fullName && (
                <div className="invalid-feedback">{errors.fullName}</div>
              )}
            </div>

            {/* Email */}
            <div className="mb-3">
              <label htmlFor="email" className="form-label">
                Email address
              </label>
              <input
                type="email"
                className={`form-control ${errors.email ? "is-invalid" : ""}`}
                id="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && (
                <div className="invalid-feedback">{errors.email}</div>
              )}
            </div>

            {/* Role Dropdown */}
            <div className="mb-3">
              <label htmlFor="role" className="form-label">
                Role
              </label>
              <select
                className="form-select"
                id="role"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {roles.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
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
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  <div className="invalid-feedback d-block">{errors.password}</div>
                )}
              </div>
              {/* Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="d-flex align-items-center mb-1">
                    <small className="me-2">Strength:</small>
                    <span className={`text-${strengthColor}`}>{strengthText}</span>
                  </div>
                  <div className={styles.strengthBar}>
                    <div
                      className={styles[`strength-${strengthScore}`]}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
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
                placeholder="Re‑enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <div className="invalid-feedback">{errors.confirmPassword}</div>
              )}
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
              ) : null}
              {loading ? "Creating..." : "Create Account"}
            </button>

            <hr className="my-4" />
            <button
              type="button"
              className="btn btn-outline-primary w-100 d-flex align-items-center justify-content-center"
            >
              <i className="bi bi-google me-2"></i>
              Continue with Google
            </button>

            <p className="text-center mt-3">
              Already have an account?{' '}
              <a href="#" className={styles.loginLink}>Login</a>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
