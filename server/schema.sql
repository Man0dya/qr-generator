-- Users Table: Handles Auth
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255), -- Nullable for Google/Meta logins
    provider ENUM('email', 'google', 'meta', 'microsoft') DEFAULT 'email',
    role ENUM('user', 'admin', 'super_admin') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- QR Codes Table: Stores the dynamic links
CREATE TABLE qr_codes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    short_code VARCHAR(10) NOT NULL UNIQUE, -- The part after site.com/
    destination_url TEXT NOT NULL,
    status ENUM('active', 'paused', 'banned') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Analytics Table: Tracks every scan
CREATE TABLE analytics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    qr_code_id INT,
    scan_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    country VARCHAR(100),
    device_type VARCHAR(50), -- Mobile, Desktop, Tablet
    os VARCHAR(50),          -- Android, iOS, Windows
    FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE CASCADE
);