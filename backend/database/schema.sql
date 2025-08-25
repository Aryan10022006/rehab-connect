-- Professional Healthcare Platform Database Schema
-- Updated: August 2025

-- Users table with premium features
CREATE TABLE users (
    id VARCHAR(255) PRIMARY KEY,
    firebase_uid VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    phone VARCHAR(20),
    profile_image_url TEXT,
    is_premium BOOLEAN DEFAULT FALSE,
    premium_expires_at TIMESTAMP NULL,
    subscription_type ENUM('free', 'monthly', 'yearly') DEFAULT 'free',
    subscription_id VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    preferences JSON,
    location_lat DECIMAL(10, 8) NULL,
    location_lng DECIMAL(11, 8) NULL,
    location_address TEXT NULL,
    INDEX idx_firebase_uid (firebase_uid),
    INDEX idx_email (email),
    INDEX idx_premium (is_premium)
);

-- Premium subscriptions table
CREATE TABLE subscriptions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    plan_type ENUM('monthly', 'yearly') NOT NULL,
    status ENUM('active', 'cancelled', 'expired', 'pending') DEFAULT 'pending',
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_gateway ENUM('stripe', 'razorpay', 'paypal') NOT NULL,
    gateway_subscription_id VARCHAR(255),
    starts_at TIMESTAMP NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    auto_renew BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_expires_at (expires_at)
);

-- Payment transactions table
CREATE TABLE transactions (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    subscription_id VARCHAR(255) NULL,
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    payment_gateway ENUM('stripe', 'razorpay', 'paypal') NOT NULL,
    gateway_transaction_id VARCHAR(255) NOT NULL,
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    status ENUM('pending', 'completed', 'failed', 'refunded', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    gateway_response JSON,
    metadata JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_gateway_transaction_id (gateway_transaction_id)
);

-- Enhanced clinics table
CREATE TABLE clinics (
    id VARCHAR(255) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(10),
    country VARCHAR(100) DEFAULT 'India',
    lat DECIMAL(10, 8) NOT NULL,
    lng DECIMAL(11, 8) NOT NULL,
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    gmap_link TEXT,
    services JSON,
    specializations JSON,
    facilities JSON,
    timings JSON,
    emergency_contact VARCHAR(20),
    verified BOOLEAN DEFAULT FALSE,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_reviews INT DEFAULT 0,
    status ENUM('active', 'inactive', 'pending', 'suspended') DEFAULT 'pending',
    images JSON,
    cover_image VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_location (lat, lng),
    INDEX idx_status (status),
    INDEX idx_verified (verified),
    INDEX idx_rating (rating),
    FULLTEXT(name, description, address, city)
);

-- User favorites
CREATE TABLE user_favorites (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    clinic_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    UNIQUE KEY unique_favorite (user_id, clinic_id),
    INDEX idx_user_id (user_id)
);

-- User clinic views/history
CREATE TABLE user_clinic_views (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    clinic_id VARCHAR(255) NOT NULL,
    viewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    session_id VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_clinic_id (clinic_id),
    INDEX idx_viewed_at (viewed_at)
);

-- Reviews and ratings
CREATE TABLE reviews (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    clinic_id VARCHAR(255) NOT NULL,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    comment TEXT,
    images JSON,
    visit_date DATE,
    is_verified BOOLEAN DEFAULT FALSE,
    helpful_count INT DEFAULT 0,
    reported_count INT DEFAULT 0,
    status ENUM('active', 'pending', 'hidden', 'removed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_clinic_review (user_id, clinic_id),
    INDEX idx_clinic_id (clinic_id),
    INDEX idx_rating (rating),
    INDEX idx_status (status)
);

-- Clinic images
CREATE TABLE clinic_images (
    id VARCHAR(255) PRIMARY KEY,
    clinic_id VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    image_type ENUM('cover', 'gallery', 'facility', 'equipment', 'staff') DEFAULT 'gallery',
    title VARCHAR(255),
    description TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    display_order INT DEFAULT 0,
    uploaded_by VARCHAR(255),
    upload_source ENUM('admin', 'clinic_owner', 'user_review') DEFAULT 'admin',
    status ENUM('active', 'pending', 'rejected') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (clinic_id) REFERENCES clinics(id) ON DELETE CASCADE,
    INDEX idx_clinic_id (clinic_id),
    INDEX idx_type (image_type),
    INDEX idx_status (status),
    INDEX idx_display_order (display_order)
);

-- Admin users
CREATE TABLE admin_users (
    id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('super_admin', 'admin', 'moderator') DEFAULT 'admin',
    permissions JSON,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    login_attempts INT DEFAULT 0,
    locked_until TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_role (role),
    INDEX idx_is_active (is_active)
);

-- Admin activity logs
CREATE TABLE admin_logs (
    id VARCHAR(255) PRIMARY KEY,
    admin_id VARCHAR(255) NOT NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);

-- System settings
CREATE TABLE system_settings (
    id VARCHAR(255) PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSON,
    description TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    updated_by VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_public (is_public)
);

-- Insert default admin user (password should be hashed in real implementation)
INSERT INTO admin_users (id, username, email, password_hash, name, role) VALUES 
('admin-001', 'admin', 'admin@rehabconnect.com', '$2b$12$hash_placeholder', 'System Administrator', 'super_admin');

-- Insert default system settings
INSERT INTO system_settings (id, setting_key, setting_value, description, is_public) VALUES 
('set-001', 'platform_name', '"RehabConnect"', 'Platform display name', true),
('set-002', 'free_plan_limits', '{"maxClinics": 3, "maxDistance": 5, "defaultDistance": 1}', 'Free plan limitations', false),
('set-003', 'premium_prices', '{"monthly": 199, "yearly": 1999}', 'Premium subscription prices', true),
('set-004', 'payment_gateways', '{"enabled": ["razorpay", "stripe"], "default": "razorpay"}', 'Payment gateway configuration', false);
