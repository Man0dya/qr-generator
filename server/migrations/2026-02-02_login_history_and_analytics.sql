-- 2026-02-02: Login history + analytics improvements
-- Apply this in your MySQL database used by the PHP API.
-- Recommended: run in a transaction if your environment supports it.

-- 1) Ensure users.name exists (client and login.php expect it)
SET @db := DATABASE();
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'users'
        AND COLUMN_NAME = 'name'
    ),
    'SELECT "users.name already exists" AS info;',
    'ALTER TABLE users ADD COLUMN name VARCHAR(255) NULL;'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Backfill name for existing records (optional)
UPDATE users
  SET name = COALESCE(name, SUBSTRING_INDEX(email, '@', 1))
  WHERE name IS NULL;

-- 2) Store QR design config (used by create_qr.php)
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'qr_codes'
        AND COLUMN_NAME = 'design_config'
    ),
    'SELECT "qr_codes.design_config already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN design_config JSON NULL;'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Add browser to analytics (optional but useful). If you don't want it, skip this.
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db
        AND TABLE_NAME = 'analytics'
        AND COLUMN_NAME = 'browser'
    ),
    'SELECT "analytics.browser already exists" AS info;',
    'ALTER TABLE analytics ADD COLUMN browser VARCHAR(50) NULL;'
  )
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4) Login session history table
CREATE TABLE IF NOT EXISTS login_sessions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  login_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  logout_time TIMESTAMP NULL DEFAULT NULL,
  session_duration_seconds INT NULL DEFAULT NULL,
  ip_address VARCHAR(45) NULL,
  country VARCHAR(100) NULL,
  device_type VARCHAR(50) NULL,
  os VARCHAR(50) NULL,
  browser VARCHAR(50) NULL,
  user_agent VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_login_sessions_user_time (user_id, login_time),
  CONSTRAINT fk_login_sessions_user
    FOREIGN KEY (user_id) REFERENCES users(id)
    ON DELETE CASCADE
);

-- 5) System settings table (used by system_settings.php)
CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed maintenance_mode if missing
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('maintenance_mode', 'false')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
