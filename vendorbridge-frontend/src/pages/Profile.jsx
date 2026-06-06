import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { profileService } from "../services/api";
import styles from "./Profile.module.css";

const isStrongPassword = (pwd) => {
  if (!pwd || pwd.length < 8) return false;
  return (
    /[A-Z]/.test(pwd) &&
    /[a-z]/.test(pwd) &&
    /[0-9]/.test(pwd) &&
    /[^A-Za-z0-9]/.test(pwd)
  );
};

const Profile = () => {
  const navigate = useNavigate();
  const { user, refreshUser, logout, getDashboardPath } = useAuth();

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfileForm,
    formState: { errors: profileErrors },
  } = useForm();

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    watch: watchPassword,
    reset: resetPasswordForm,
    formState: { errors: passwordErrors },
  } = useForm();

  const newPasswordValue = watchPassword("newPassword", "");
  const isGoogleOnly = Boolean(user?.googleId && !user?.hasPassword);

  useEffect(() => {
    const loadProfile = async () => {
      setProfileLoading(true);
      setProfileError("");
      try {
        const response = await profileService.getProfile();
        resetProfileForm({
          fullName: response.user.fullName,
          profilePicture: response.user.profilePicture || "",
        });
        await refreshUser();
      } catch (error) {
        setProfileError(
          error.response?.data?.message || "Failed to load profile. Please try again."
        );
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [refreshUser, resetProfileForm]);

  const onProfileSubmit = async (data) => {
    setProfileSaving(true);
    setProfileError("");
    setProfileSuccess("");

    try {
      const response = await profileService.updateProfile({
        fullName: data.fullName,
        profilePicture: data.profilePicture || null,
      });
      setProfileSuccess(response.message || "Profile updated successfully.");
      await refreshUser();
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Failed to update profile. Please try again."
      );
    } finally {
      setProfileSaving(false);
    }
  };

  const onPasswordSubmit = async (data) => {
    setPasswordSaving(true);
    setPasswordError("");
    setPasswordSuccess("");

    try {
      const response = await profileService.changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });

      setPasswordSuccess(response.message || "Password changed successfully.");
      resetPasswordForm();

      if (response.requireReLogin) {
        setTimeout(async () => {
          await logout();
          navigate("/login", { replace: true });
        }, 2000);
      }
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Failed to change password. Please try again."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (profileLoading) {
    return (
      <div className={`min-vh-100 d-flex align-items-center justify-content-center ${styles.wrapper}`}>
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted mt-3 mb-0">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-vh-100 ${styles.wrapper}`}>
      <nav className="navbar navbar-expand-lg navbar-dark bg-primary shadow-sm px-4">
        <span className="navbar-brand fw-bold">
          <i className="bi bi-shuffle me-2"></i>VendorBridge ERP
        </span>
        <div className="ms-auto d-flex gap-2">
          <button
            type="button"
            className="btn btn-outline-light btn-sm"
            onClick={() => navigate(getDashboardPath(user?.role))}
          >
            <i className="bi bi-grid me-1"></i>Dashboard
          </button>
        </div>
      </nav>

      <div className="container py-5">
        <div className="row justify-content-center">
          <div className="col-lg-8">
            <h2 className="fw-bold mb-1">My Profile</h2>
            <p className="text-muted mb-4">View and manage your account information</p>

            <div className="card border-0 shadow-sm mb-4">
              <div className="card-body p-4">
                <div className="d-flex align-items-center gap-3 mb-4">
                  {user?.profilePicture ? (
                    <img
                      src={user.profilePicture}
                      alt="Profile"
                      className="rounded-circle border"
                      style={{ width: "72px", height: "72px", objectFit: "cover" }}
                    />
                  ) : (
                    <div
                      className="rounded-circle bg-primary-subtle text-primary fw-bold d-flex align-items-center justify-content-center"
                      style={{ width: "72px", height: "72px", fontSize: "1.5rem" }}
                    >
                      {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                    </div>
                  )}
                  <div>
                    <h5 className="mb-1">{user?.fullName}</h5>
                    <p className="text-muted mb-0">{user?.email}</p>
                    <span className="badge bg-primary-subtle text-primary mt-1">{user?.role}</span>
                  </div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Email</label>
                    <input type="text" className="form-control" value={user?.email || ""} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Role</label>
                    <input type="text" className="form-control" value={user?.role || ""} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Account Created</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(user?.created_at)}
                      disabled
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label text-muted small">Sign-in Method</label>
                    <input
                      type="text"
                      className="form-control"
                      value={user?.googleId ? "Google + Password" : user?.hasPassword ? "Email & Password" : "Google"}
                      disabled
                    />
                  </div>
                </div>

                {profileError && (
                  <div className="alert alert-danger py-2 small">{profileError}</div>
                )}
                {profileSuccess && (
                  <div className="alert alert-success py-2 small">{profileSuccess}</div>
                )}

                <form onSubmit={handleProfileSubmit(onProfileSubmit)} noValidate>
                  <h6 className="fw-semibold mb-3">Edit Profile</h6>

                  <div className="mb-3">
                    <label htmlFor="fullName" className="form-label">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      className={`form-control ${profileErrors.fullName ? "is-invalid" : ""}`}
                      {...registerProfile("fullName", {
                        required: "Full name is required.",
                        minLength: { value: 2, message: "Full name must be at least 2 characters." },
                      })}
                    />
                    {profileErrors.fullName && (
                      <div className="invalid-feedback">{profileErrors.fullName.message}</div>
                    )}
                  </div>

                  <div className="mb-3">
                    <label htmlFor="profilePicture" className="form-label">
                      Profile Picture URL
                    </label>
                    <input
                      type="url"
                      id="profilePicture"
                      className={`form-control ${profileErrors.profilePicture ? "is-invalid" : ""}`}
                      placeholder="https://example.com/avatar.jpg"
                      {...registerProfile("profilePicture", {
                        validate: (value) => {
                          if (!value) return true;
                          return (
                            /^https?:\/\/.+/i.test(value) ||
                            "Please enter a valid HTTP or HTTPS URL."
                          );
                        },
                      })}
                    />
                    {profileErrors.profilePicture && (
                      <div className="invalid-feedback">{profileErrors.profilePicture.message}</div>
                    )}
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                    {profileSaving ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {!isGoogleOnly && (
              <div className="card border-0 shadow-sm">
                <div className="card-body p-4">
                  <h6 className="fw-semibold mb-3">Change Password</h6>
                  <p className="text-muted small">
                    After changing your password, you will be signed out and must log in again.
                  </p>

                  {passwordError && (
                    <div className="alert alert-danger py-2 small">{passwordError}</div>
                  )}
                  {passwordSuccess && (
                    <div className="alert alert-success py-2 small">{passwordSuccess}</div>
                  )}

                  <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} noValidate>
                    <div className="mb-3">
                      <label htmlFor="currentPassword" className="form-label">
                        Current Password
                      </label>
                      <div className="input-group">
                        <input
                          type={showCurrentPassword ? "text" : "password"}
                          id="currentPassword"
                          className={`form-control ${passwordErrors.currentPassword ? "is-invalid" : ""}`}
                          {...registerPassword("currentPassword", {
                            required: "Current password is required.",
                          })}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        >
                          <i className={`bi ${showCurrentPassword ? "bi-eye-slash" : "bi-eye"}`} />
                        </button>
                        {passwordErrors.currentPassword && (
                          <div className="invalid-feedback d-block">
                            {passwordErrors.currentPassword.message}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="newPassword" className="form-label">
                        New Password
                      </label>
                      <div className="input-group">
                        <input
                          type={showNewPassword ? "text" : "password"}
                          id="newPassword"
                          className={`form-control ${passwordErrors.newPassword ? "is-invalid" : ""}`}
                          {...registerPassword("newPassword", {
                            required: "New password is required.",
                            validate: {
                              strength: (value) =>
                                isStrongPassword(value) ||
                                "Password must be 8+ chars with uppercase, lowercase, number, and special character.",
                            },
                          })}
                        />
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                        >
                          <i className={`bi ${showNewPassword ? "bi-eye-slash" : "bi-eye"}`} />
                        </button>
                        {passwordErrors.newPassword && (
                          <div className="invalid-feedback d-block">
                            {passwordErrors.newPassword.message}
                          </div>
                        )}
                      </div>
                      {newPasswordValue && (
                        <small className={`text-${isStrongPassword(newPasswordValue) ? "success" : "muted"}`}>
                          {isStrongPassword(newPasswordValue)
                            ? "Password meets all requirements."
                            : "Must include uppercase, lowercase, number, and special character."}
                        </small>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="confirmPassword" className="form-label">
                        Confirm New Password
                      </label>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="confirmPassword"
                        className={`form-control ${passwordErrors.confirmPassword ? "is-invalid" : ""}`}
                        {...registerPassword("confirmPassword", {
                          required: "Please confirm your new password.",
                          validate: (value) =>
                            value === newPasswordValue || "Passwords do not match.",
                        })}
                      />
                      {passwordErrors.confirmPassword && (
                        <div className="invalid-feedback">{passwordErrors.confirmPassword.message}</div>
                      )}
                    </div>

                    <button type="submit" className="btn btn-warning text-dark" disabled={passwordSaving}>
                      {passwordSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" />
                          Updating...
                        </>
                      ) : (
                        "Change Password"
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}

            {isGoogleOnly && (
              <div className="alert alert-info border-0 shadow-sm">
                <i className="bi bi-google me-2"></i>
                Your account uses Google sign-in only. Password change is not available.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
