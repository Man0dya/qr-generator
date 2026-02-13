-- server/migrations/002_phase2_schema.sql

-- 1. Custom Domains
CREATE TABLE IF NOT EXISTS custom_domains (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('pending', 'active', 'invalid') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Teams & Members
CREATE TABLE IF NOT EXISTS teams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    owner_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_members (
    id INT AUTO_INCREMENT PRIMARY KEY,
    team_id INT NOT NULL,
    user_id INT NOT NULL,
    role ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_team_user (team_id, user_id)
);

-- 3. API Keys
CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(100) DEFAULT 'My API Key',
    api_key VARCHAR(64) NOT NULL UNIQUE, -- SHA-256 hash or random string
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Update QR Codes Table
-- We use safe ADD COLUMN checks (since MySQL doesn't support IF NOT EXISTS for columns in one line easily, we'll just try adding them)
-- For simplicity in this environment, we'll run these. If they exist it might error, so we'll handle that in PHP or just ignore if it's a fresh run.

ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS custom_domain_id INT NULL;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS team_id INT NULL;
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS qr_type ENUM('url', 'vcard', 'wifi', 'app', 'bio') DEFAULT 'url';
ALTER TABLE qr_codes ADD COLUMN IF NOT EXISTS qr_data JSON NULL; -- For vCard details, Bio page links, etc.

ALTER TABLE qr_codes ADD CONSTRAINT fk_custom_domain FOREIGN KEY (custom_domain_id) REFERENCES custom_domains(id) ON DELETE SET NULL;
ALTER TABLE qr_codes ADD CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- 5. Bulk Imports (Optional logging)
CREATE TABLE IF NOT EXISTS bulk_imports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    filename VARCHAR(255),
    status ENUM('processing', 'completed', 'failed') DEFAULT 'processing',
    total_records INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
