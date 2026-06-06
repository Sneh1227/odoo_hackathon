-- Migration 001: Add missing columns and tables (idempotent, no drops)
-- Safe to run multiple times against existing VendorBridge databases.

-- Roles table (required by application code)
CREATE TABLE IF NOT EXISTS tbl_roles (
    role_id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO tbl_roles (role_name)
SELECT role_name FROM (VALUES
    ('Admin'),
    ('Vendor'),
    ('Procurement Officer'),
    ('Manager')
) AS seed(role_name)
WHERE NOT EXISTS (
    SELECT 1 FROM tbl_roles existing WHERE existing.role_name = seed.role_name
);

-- Users table (create only if missing — preserves existing data)
CREATE TABLE IF NOT EXISTS tbl_users (
    user_id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255),
    role_id INTEGER NOT NULL DEFAULT 2 REFERENCES tbl_roles(role_id),
    google_id VARCHAR(255) UNIQUE,
    profile_picture VARCHAR(500),
    is_verified BOOLEAN DEFAULT FALSE,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add columns that may be missing on legacy installations
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tbl_users' AND column_name = 'reset_token'
    ) THEN
        ALTER TABLE tbl_users ADD COLUMN reset_token VARCHAR(255);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tbl_users' AND column_name = 'reset_token_expiry'
    ) THEN
        ALTER TABLE tbl_users ADD COLUMN reset_token_expiry TIMESTAMP;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tbl_users' AND column_name = 'profile_picture'
    ) THEN
        ALTER TABLE tbl_users ADD COLUMN profile_picture VARCHAR(500);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tbl_users' AND column_name = 'google_id'
    ) THEN
        ALTER TABLE tbl_users ADD COLUMN google_id VARCHAR(255) UNIQUE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tbl_users' AND column_name = 'is_verified'
    ) THEN
        ALTER TABLE tbl_users ADD COLUMN is_verified BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tbl_users' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE tbl_users ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_tbl_users_email ON tbl_users(email);
CREATE INDEX IF NOT EXISTS idx_tbl_users_google_id ON tbl_users(google_id);
CREATE INDEX IF NOT EXISTS idx_tbl_users_reset_token ON tbl_users(reset_token);
