CREATE TABLE IF NOT EXISTS auth_sessions (
  id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  user_id INT NOT NULL,
  expires_at DATETIME NOT NULL,
  revoked_at DATETIME NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX auth_sessions_user (user_id),
  INDEX auth_sessions_expiry (expires_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS auth_rate_limits (
  id CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL PRIMARY KEY,
  attempts INT UNSIGNED NOT NULL DEFAULT 0,
  reset_at DATETIME NOT NULL,
  INDEX auth_rate_limits_expiry (reset_at)
) ENGINE=InnoDB;
