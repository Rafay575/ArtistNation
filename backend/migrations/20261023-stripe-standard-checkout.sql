ALTER TABLE orders ENGINE=InnoDB;
CREATE TABLE IF NOT EXISTS store_checkouts (
 id CHAR(36) PRIMARY KEY, fan_id INT NOT NULL, business_id INT NOT NULL,
 artist_id INT NOT NULL, stripe_account_id VARCHAR(255) NOT NULL,
 request_hash CHAR(64) NOT NULL, payload JSON NOT NULL, amount INT UNSIGNED NOT NULL,
 session_id VARCHAR(255) NULL, order_id INT NULL,
 created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY checkout_session (stripe_account_id, session_id)
) ENGINE=InnoDB;
