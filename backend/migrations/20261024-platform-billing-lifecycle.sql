-- Run once before deploying the lifecycle worker. Existing Stripe IDs are preserved.
ALTER TABLE subscriptions ADD COLUMN stripe_status VARCHAR(40) NULL,
 ADD COLUMN cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
 ADD COLUMN last_synced_at DATETIME NULL;
ALTER TABLE subscriptions MODIFY COLUMN plan ENUM('starter','pro','professional','enterprise') NOT NULL;
-- Every table touched by account archival must participate in the same transaction.
ALTER TABLE users ENGINE=InnoDB;
ALTER TABLE businesses ENGINE=InnoDB;
ALTER TABLE subscriptions ENGINE=InnoDB;
ALTER TABLE invoice_history ENGINE=InnoDB;
ALTER TABLE fans ENGINE=InnoDB;
ALTER TABLE orders ENGINE=InnoDB;
ALTER TABLE payment_methods ENGINE=InnoDB;
ALTER TABLE pickup_locations ENGINE=InnoDB;
ALTER TABLE contact_submissions ENGINE=InnoDB;
ALTER TABLE website_pages ENGINE=InnoDB;
ALTER TABLE website_sections ENGINE=InnoDB;
ALTER TABLE website_media ENGINE=InnoDB;
ALTER TABLE website_settings ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS expired_account_records (
 id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
 original_user_id INT NOT NULL,
 original_business_id INT NOT NULL,
 email VARCHAR(255) NOT NULL,
 subdomain VARCHAR(100) NOT NULL,
 account_record JSON NOT NULL,
 billing_record JSON NOT NULL,
 expired_at DATETIME NOT NULL,
 archived_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY archived_business (original_business_id)
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS billing_checkout_attempts (
 business_id INT PRIMARY KEY,
 request_id CHAR(36) NOT NULL,
 session_id VARCHAR(255) NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS billing_file_cleanup (
 user_id INT PRIMARY KEY,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;
