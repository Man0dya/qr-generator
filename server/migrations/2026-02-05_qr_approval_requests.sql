-- 2026-02-05: User approval requests for banned/paused QR links
-- Apply this in your MySQL database used by the PHP API.

SET @db := DATABASE();

-- approval_request_status: none | requested | approved | denied
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'approval_request_status'
    ),
    'SELECT "qr_codes.approval_request_status already exists" AS info;',
    "ALTER TABLE qr_codes ADD COLUMN approval_request_status ENUM('none','requested','approved','denied') NOT NULL DEFAULT 'none';"
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'approval_requested_at'
    ),
    'SELECT "qr_codes.approval_requested_at already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN approval_requested_at TIMESTAMP NULL DEFAULT NULL;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'approval_request_note'
    ),
    'SELECT "qr_codes.approval_request_note already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN approval_request_note TEXT NULL;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'approval_resolved_at'
    ),
    'SELECT "qr_codes.approval_resolved_at already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN approval_resolved_at TIMESTAMP NULL DEFAULT NULL;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND COLUMN_NAME = 'approval_resolved_by'
    ),
    'SELECT "qr_codes.approval_resolved_by already exists" AS info;',
    'ALTER TABLE qr_codes ADD COLUMN approval_resolved_by INT NULL;'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Helpful index for moderation queues
SET @sql := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = @db AND TABLE_NAME = 'qr_codes' AND INDEX_NAME = 'idx_qr_approval_request'
    ),
    'SELECT "idx_qr_approval_request already exists" AS info;',
    'CREATE INDEX idx_qr_approval_request ON qr_codes (approval_request_status, approval_requested_at);'
  )
);
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;
