-- MVP-06：将新申请绑定到登录用户，历史申请允许为空。
USE `wemove_portal`;

ALTER TABLE `dealer_application`
  ADD COLUMN `user_id` BIGINT NULL AFTER `id`;

CREATE INDEX `idx_dealer_application_user_id`
  ON `dealer_application` (`user_id`);
