ALTER TABLE url_links ADD COLUMN approval_request_status ENUM('none','requested','approved','denied') NOT NULL DEFAULT 'none';
ALTER TABLE url_links ADD COLUMN approval_requested_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE url_links ADD COLUMN approval_request_note TEXT NULL;
ALTER TABLE url_links ADD COLUMN approval_resolved_at TIMESTAMP NULL DEFAULT NULL;
ALTER TABLE url_links ADD COLUMN approval_resolved_by INT NULL;
CREATE INDEX idx_url_approval_request ON url_links (approval_request_status, approval_requested_at);
