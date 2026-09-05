-- Issue #90: bind an application to the logged-in user without rewriting old data.
ALTER TABLE `dealer_application` ADD COLUMN `user_id` BIGINT NULL AFTER `id`;
CREATE INDEX `idx_dealer_application_user_id` ON `dealer_application` (`user_id`);
