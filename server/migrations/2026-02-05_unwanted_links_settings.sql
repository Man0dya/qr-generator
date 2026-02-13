-- 2026-02-05: Unwanted link detection settings (blocklists + thresholds)
-- Apply this in your MySQL database used by the PHP API.

SET @db := DATABASE();

CREATE TABLE IF NOT EXISTS system_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_value VARCHAR(255) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Blocked domains: newline/comma separated. Supports exact, .suffix, and *.suffix
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('blocked_domains', '')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Blocked keywords: newline/comma separated (matched against full URL)
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('blocked_keywords', '')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Optional: hard-block certain TLDs
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('blocked_tlds', '')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

-- Heuristic thresholds
INSERT INTO system_settings (setting_key, setting_value)
VALUES ('auto_flag_score_threshold', '40')
ON DUPLICATE KEY UPDATE setting_value = setting_value;

INSERT INTO system_settings (setting_key, setting_value)
VALUES ('auto_ban_score_threshold', '80')
ON DUPLICATE KEY UPDATE setting_value = setting_value;
