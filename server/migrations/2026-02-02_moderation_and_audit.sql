-- 2026-02-02: Moderation flagging + Super Admin audit logs
-- Apply this in your MySQL database used by the PHP API.

SET @db := DATABASE();

-- 1) Add moderation/flagging fields to qr_codes
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'is_flagged'
    ),
    'SELECT "qr_codes.is_flagged already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN is_flagged TINYINT(1) NOT NULL DEFAULT 0;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'flag_reason'
    ),
    'SELECT "qr_codes.flag_reason already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN flag_reason TEXT NULL;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'flagged_at'
    ),
    'SELECT "qr_codes.flagged_at already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN flagged_at TIMESTAMP NULL DEFAULT NULL;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'reviewed_by'
    ),
    'SELECT "qr_codes.reviewed_by already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN reviewed_by INT NULL;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'reviewed_at'
    ),
    'SELECT "qr_codes.reviewed_at already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN reviewed_at TIMESTAMP NULL DEFAULT NULL;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- 2) Super Admin audit log table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  actor_user_id INT NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50) NULL,
  target_id BIGINT NULL,
  details TEXT NULL,
  ip_address VARCHAR(45) NULL,
  user_agent VARCHAR(512) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_audit_created_at (created_at),
  INDEX idx_audit_actor (actor_user_id, created_at)
);
