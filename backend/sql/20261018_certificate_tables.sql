-- Run on database research_ustad_workshop (production has synchronize=false).
-- Backup before running. This creates new tables without altering existing registrations.

CREATE TABLE IF NOT EXISTS certificates (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  certificate_id VARCHAR(70) NOT NULL,
  registration_id VARCHAR(255) NULL,
  source VARCHAR(16) NOT NULL DEFAULT 'registered',
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  whatsapp VARCHAR(255) NULL,
  department VARCHAR(255) NULL,
  university_name VARCHAR(255) NULL,
  workshop_code VARCHAR(50) NOT NULL,
  workshop_name VARCHAR(255) NOT NULL,
  workshop_date DATE NOT NULL,
  certificate_status VARCHAR(16) NOT NULL DEFAULT 'issued',
  email_status VARCHAR(16) NOT NULL DEFAULT 'queued',
  email_error TEXT NULL,
  send_attempts INT NOT NULL DEFAULT 0,
  processing_started_at DATETIME NULL,
  sent_at DATETIME NULL,
  issued_by VARCHAR(36) NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  updated_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE KEY uq_certificate_id (certificate_id),
  UNIQUE KEY uq_cert_workshop_registration (workshop_code, registration_id),
  INDEX idx_cert_status (certificate_status, email_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS certificate_email_logs (
  id VARCHAR(36) NOT NULL PRIMARY KEY,
  certificate_id VARCHAR(70) NOT NULL,
  email VARCHAR(255) NOT NULL,
  status VARCHAR(16) NOT NULL,
  error TEXT NULL,
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  KEY idx_email_log_cert (certificate_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
