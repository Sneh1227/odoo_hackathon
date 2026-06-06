-- schema.sql
-- PostgreSQL Database Schema for VendorBridge Authentication & Authorization Module

-- Create Role Enum/Type or simple CHECK constraints.
-- Let's use a CHECK constraint on the role column to enforce allowed values:
-- 'Admin', 'Vendor', 'Procurement Officer', 'Manager'

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255), -- Nullable for Google OAuth users
    role VARCHAR(50) NOT NULL DEFAULT 'Vendor' CHECK (role IN ('Admin', 'Vendor', 'Procurement Officer', 'Manager')),
    google_id VARCHAR(255) UNIQUE,
    profile_picture VARCHAR(255),
    is_verified BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index on email and google_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
