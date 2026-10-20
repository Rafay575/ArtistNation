-- Run once before deploying the signup/onboarding fixes.
-- These tables participate in account activation and onboarding transactions.
ALTER TABLE businesses ENGINE=InnoDB;
ALTER TABLE subscriptions ENGINE=InnoDB;
ALTER TABLE website_pages ENGINE=InnoDB;
ALTER TABLE website_sections ENGINE=InnoDB;
ALTER TABLE website_settings ENGINE=InnoDB;
