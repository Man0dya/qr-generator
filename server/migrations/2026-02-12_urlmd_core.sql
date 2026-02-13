-- 2026-02-12: URLMD core schema (standalone URL shortener + QR integration)

CREATE TABLE IF NOT EXISTS url_links (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  custom_domain_id INT NULL,
  short_code VARCHAR(32) NOT NULL UNIQUE,
  destination_url TEXT NOT NULL,
  title VARCHAR(255) NULL,
  note TEXT NULL,
  status ENUM('active','paused','expired','blocked') NOT NULL DEFAULT 'active',
  redirect_type ENUM('301','302') NOT NULL DEFAULT '302',
  expires_at DATETIME NULL,
  is_flagged TINYINT(1) NOT NULL DEFAULT 0,
  flag_reason TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (custom_domain_id) REFERENCES custom_domains(id) ON DELETE SET NULL,
  INDEX idx_url_links_user_created (user_id, created_at),
  INDEX idx_url_links_status (status),
  INDEX idx_url_links_expires (expires_at)
);

CREATE TABLE IF NOT EXISTS url_clicks (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  url_link_id INT NOT NULL,
  qr_code_id INT NULL,
  click_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(45) NULL,
  country VARCHAR(100) NULL,
  referrer VARCHAR(255) NULL,
  user_agent VARCHAR(500) NULL,
  device_type VARCHAR(50) NULL,
  os VARCHAR(50) NULL,
  browser VARCHAR(50) NULL,
  is_bot TINYINT(1) NOT NULL DEFAULT 0,
  FOREIGN KEY (url_link_id) REFERENCES url_links(id) ON DELETE CASCADE,
  FOREIGN KEY (qr_code_id) REFERENCES qr_codes(id) ON DELETE SET NULL,
  INDEX idx_url_clicks_link_time (url_link_id, click_time),
  INDEX idx_url_clicks_country (country),
  INDEX idx_url_clicks_device (device_type)
);

ALTER TABLE qr_codes
  ADD COLUMN IF NOT EXISTS url_link_id INT NULL,
  ADD CONSTRAINT fk_qr_url_link FOREIGN KEY (url_link_id) REFERENCES url_links(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS url_ab_variants (
  id INT AUTO_INCREMENT PRIMARY KEY,
  url_link_id INT NOT NULL,
  variant_label VARCHAR(40) NOT NULL,
  destination_url TEXT NOT NULL,
  weight_percent INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (url_link_id) REFERENCES url_links(id) ON DELETE CASCADE,
  UNIQUE KEY uq_link_variant_label (url_link_id, variant_label)
);

CREATE TABLE IF NOT EXISTS url_webhook_subscriptions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_name VARCHAR(80) NOT NULL,
  callback_url VARCHAR(500) NOT NULL,
  secret_token VARCHAR(120) NULL,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_webhooks_user_event (user_id, event_name)
);
