-- ========================================================
-- MVP-08 经销商工作台：采购、报价、单据、企业地址与成员角色
-- 只做增量变更，不删除已有业务数据。
-- ========================================================

USE `wemove_portal`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `sys_user`
  ADD COLUMN `dealer_member_role` VARCHAR(32) NULL COMMENT '经销商企业内角色：OWNER/MEMBER' AFTER `company_id`;

UPDATE `sys_user`
SET `dealer_member_role` = 'OWNER'
WHERE `role` = 'DEALER' AND `company_id` IS NOT NULL AND `dealer_member_role` IS NULL;

ALTER TABLE `dealer_company`
  ADD COLUMN `payment_terms` VARCHAR(128) NOT NULL DEFAULT '预付款' COMMENT '允许的付款条款' AFTER `discount_rate`,
  ADD COLUMN `currency` VARCHAR(8) NOT NULL DEFAULT 'CNY' COMMENT '结算币种' AFTER `payment_terms`,
  ADD COLUMN `account_manager` VARCHAR(64) DEFAULT NULL COMMENT '专属客户经理' AFTER `currency`;

ALTER TABLE `orders`
  ADD COLUMN `company_id` BIGINT NULL COMMENT 'B2B 经销商企业边界' AFTER `user_id`,
  ADD COLUMN `po_number` VARCHAR(64) DEFAULT NULL COMMENT '采购订单号' AFTER `payment_method`,
  ADD COLUMN `requested_delivery_date` DATE DEFAULT NULL COMMENT '期望交期' AFTER `po_number`,
  ADD COLUMN `notes` VARCHAR(1000) DEFAULT NULL COMMENT '采购备注' AFTER `requested_delivery_date`,
  ADD COLUMN `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER `created_at`,
  ADD KEY `idx_orders_company_created` (`company_id`, `created_at`),
  ADD UNIQUE KEY `uk_orders_company_po` (`company_id`, `po_number`);

CREATE TABLE IF NOT EXISTS `dealer_quote` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `quote_no` VARCHAR(32) NOT NULL,
  `company_id` BIGINT NOT NULL,
  `created_by` BIGINT DEFAULT NULL COMMENT '创建人；历史/演示数据允许为空',
  `status` VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED' COMMENT 'SUBMITTED/QUOTED/ACCEPTED/REJECTED/EXPIRED',
  `requested_delivery_date` DATE DEFAULT NULL,
  `valid_until` DATE DEFAULT NULL,
  `notes` VARCHAR(1000) DEFAULT NULL,
  `platform_note` VARCHAR(1000) DEFAULT NULL COMMENT '平台报价或拒绝说明',
  `total_amount` DECIMAL(12,2) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dealer_quote_no` (`quote_no`),
  KEY `idx_dealer_quote_company_created` (`company_id`, `created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经销商报价请求与平台报价';

CREATE TABLE IF NOT EXISTS `dealer_quote_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `quote_id` BIGINT NOT NULL,
  `product_id` BIGINT NOT NULL,
  `sku_snapshot` VARCHAR(64) NOT NULL,
  `product_name_snapshot` VARCHAR(128) NOT NULL,
  `quantity` INT NOT NULL,
  `unit_price` DECIMAL(10,2) DEFAULT NULL,
  `subtotal` DECIMAL(12,2) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_dealer_quote_item_quote` (`quote_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经销商报价明细快照';

CREATE TABLE IF NOT EXISTS `dealer_invoice` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `invoice_no` VARCHAR(32) NOT NULL,
  `company_id` BIGINT NOT NULL,
  `order_id` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'ISSUED' COMMENT 'ISSUED/PAID/VOID',
  `amount` DECIMAL(12,2) NOT NULL,
  `issued_at` DATETIME NOT NULL,
  `due_at` DATETIME DEFAULT NULL,
  `file_url` VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_dealer_invoice_no` (`invoice_no`),
  KEY `idx_dealer_invoice_company_issued` (`company_id`, `issued_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经销商发票与结算单据';

CREATE TABLE IF NOT EXISTS `dealer_address` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `company_id` BIGINT NOT NULL,
  `label` VARCHAR(64) NOT NULL,
  `recipient_name` VARCHAR(64) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `province` VARCHAR(64) NOT NULL,
  `city` VARCHAR(64) NOT NULL,
  `district` VARCHAR(64) NOT NULL,
  `detail_address` VARCHAR(255) NOT NULL,
  `address_type` VARCHAR(32) NOT NULL DEFAULT 'SHIPPING' COMMENT 'SHIPPING/BILLING/HEADQUARTERS',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dealer_address_company` (`company_id`, `address_type`, `is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经销商企业地址簿';
