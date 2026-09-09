-- 修复曾被 MySQL CLI 以 latin1/cp1252 解释后写入 utf8mb4 列的历史 seed 文本。
-- 每列仅在出现典型 mojibake 拉丁字符时转换；正常中文和用户新数据不会被修改。
USE `wemove_portal`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE `sys_user` SET `real_name` = CONVERT(BINARY(CONVERT(`real_name` USING latin1)) USING utf8mb4)
WHERE HEX(`real_name`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `dealer_company` SET `company_name` = CONVERT(BINARY(CONVERT(`company_name` USING latin1)) USING utf8mb4)
WHERE HEX(`company_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_company` SET `business_type` = CONVERT(BINARY(CONVERT(`business_type` USING latin1)) USING utf8mb4)
WHERE HEX(`business_type`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_company` SET `region` = CONVERT(BINARY(CONVERT(`region` USING latin1)) USING utf8mb4)
WHERE HEX(`region`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_company` SET `tier_name` = CONVERT(BINARY(CONVERT(`tier_name` USING latin1)) USING utf8mb4)
WHERE HEX(`tier_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_company` SET `contact_name` = CONVERT(BINARY(CONVERT(`contact_name` USING latin1)) USING utf8mb4)
WHERE HEX(`contact_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_company` SET `payment_terms` = CONVERT(BINARY(CONVERT(`payment_terms` USING latin1)) USING utf8mb4)
WHERE HEX(`payment_terms`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_company` SET `account_manager` = CONVERT(BINARY(CONVERT(`account_manager` USING latin1)) USING utf8mb4)
WHERE HEX(`account_manager`) REGEXP '^([0-9A-F]{2})*C3';

-- 入驻申请在旧版后台列表中是最明显的遗漏，完整修复所有人工可读字段。
UPDATE `dealer_application` SET `company_name` = CONVERT(BINARY(CONVERT(`company_name` USING latin1)) USING utf8mb4)
WHERE HEX(`company_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_application` SET `business_type` = CONVERT(BINARY(CONVERT(`business_type` USING latin1)) USING utf8mb4)
WHERE HEX(`business_type`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_application` SET `region` = CONVERT(BINARY(CONVERT(`region` USING latin1)) USING utf8mb4)
WHERE HEX(`region`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_application` SET `contact_name` = CONVERT(BINARY(CONVERT(`contact_name` USING latin1)) USING utf8mb4)
WHERE HEX(`contact_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_application` SET `annual_target` = CONVERT(BINARY(CONVERT(`annual_target` USING latin1)) USING utf8mb4)
WHERE HEX(`annual_target`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_application` SET `sales_channels` = CONVERT(BINARY(CONVERT(`sales_channels` USING latin1)) USING utf8mb4)
WHERE HEX(`sales_channels`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_application` SET `tier_name` = CONVERT(BINARY(CONVERT(`tier_name` USING latin1)) USING utf8mb4)
WHERE HEX(`tier_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_application` SET `audit_note` = CONVERT(BINARY(CONVERT(`audit_note` USING latin1)) USING utf8mb4)
WHERE HEX(`audit_note`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `product_category` SET `name` = CONVERT(BINARY(CONVERT(`name` USING latin1)) USING utf8mb4)
WHERE HEX(`name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `product_category` SET `description` = CONVERT(BINARY(CONVERT(`description` USING latin1)) USING utf8mb4)
WHERE HEX(`description`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `product` SET `name` = CONVERT(BINARY(CONVERT(`name` USING latin1)) USING utf8mb4)
WHERE HEX(`name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `product` SET `age_range` = CONVERT(BINARY(CONVERT(`age_range` USING latin1)) USING utf8mb4)
WHERE HEX(`age_range`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `product` SET `material` = CONVERT(BINARY(CONVERT(`material` USING latin1)) USING utf8mb4)
WHERE HEX(`material`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `product` SET `scene` = CONVERT(BINARY(CONVERT(`scene` USING latin1)) USING utf8mb4)
WHERE HEX(`scene`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `product` SET `summary` = CONVERT(BINARY(CONVERT(`summary` USING latin1)) USING utf8mb4)
WHERE HEX(`summary`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `product` SET `description` = CONVERT(BINARY(CONVERT(`description` USING latin1)) USING utf8mb4)
WHERE HEX(`description`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `product` SET `specs_json` = CONVERT(BINARY(CONVERT(`specs_json` USING latin1)) USING utf8mb4)
WHERE HEX(CAST(`specs_json` AS CHAR)) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `product` SET `tag` = CONVERT(BINARY(CONVERT(`tag` USING latin1)) USING utf8mb4)
WHERE HEX(`tag`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `article_category` SET `name` = CONVERT(BINARY(CONVERT(`name` USING latin1)) USING utf8mb4)
WHERE HEX(`name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `article` SET `title` = CONVERT(BINARY(CONVERT(`title` USING latin1)) USING utf8mb4)
WHERE HEX(`title`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `article` SET `summary` = CONVERT(BINARY(CONVERT(`summary` USING latin1)) USING utf8mb4)
WHERE HEX(`summary`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `article` SET `content` = CONVERT(BINARY(CONVERT(`content` USING latin1)) USING utf8mb4)
WHERE HEX(`content`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `page` SET `title` = CONVERT(BINARY(CONVERT(`title` USING latin1)) USING utf8mb4)
WHERE HEX(`title`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `page` SET `sections_json` = CONVERT(BINARY(CONVERT(`sections_json` USING latin1)) USING utf8mb4)
WHERE HEX(`sections_json`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `faq` SET `question` = CONVERT(BINARY(CONVERT(`question` USING latin1)) USING utf8mb4)
WHERE HEX(`question`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `faq` SET `answer` = CONVERT(BINARY(CONVERT(`answer` USING latin1)) USING utf8mb4)
WHERE HEX(`answer`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `faq` SET `category` = CONVERT(BINARY(CONVERT(`category` USING latin1)) USING utf8mb4)
WHERE HEX(`category`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `download_resource` SET `title` = CONVERT(BINARY(CONVERT(`title` USING latin1)) USING utf8mb4)
WHERE HEX(`title`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `download_resource` SET `description` = CONVERT(BINARY(CONVERT(`description` USING latin1)) USING utf8mb4)
WHERE HEX(`description`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `download_resource` SET `category` = CONVERT(BINARY(CONVERT(`category` USING latin1)) USING utf8mb4)
WHERE HEX(`category`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `contact_message` SET `name` = CONVERT(BINARY(CONVERT(`name` USING latin1)) USING utf8mb4)
WHERE HEX(`name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `contact_message` SET `subject` = CONVERT(BINARY(CONVERT(`subject` USING latin1)) USING utf8mb4)
WHERE HEX(`subject`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `contact_message` SET `content` = CONVERT(BINARY(CONVERT(`content` USING latin1)) USING utf8mb4)
WHERE HEX(`content`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `contact_message` SET `handle_note` = CONVERT(BINARY(CONVERT(`handle_note` USING latin1)) USING utf8mb4)
WHERE HEX(`handle_note`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `orders` SET `customer_name` = CONVERT(BINARY(CONVERT(`customer_name` USING latin1)) USING utf8mb4)
WHERE HEX(`customer_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `orders` SET `customer_company` = CONVERT(BINARY(CONVERT(`customer_company` USING latin1)) USING utf8mb4)
WHERE HEX(`customer_company`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `orders` SET `customer_address` = CONVERT(BINARY(CONVERT(`customer_address` USING latin1)) USING utf8mb4)
WHERE HEX(`customer_address`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `orders` SET `notes` = CONVERT(BINARY(CONVERT(`notes` USING latin1)) USING utf8mb4)
WHERE HEX(`notes`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `order_item` SET `product_name` = CONVERT(BINARY(CONVERT(`product_name` USING latin1)) USING utf8mb4)
WHERE HEX(`product_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_quote` SET `notes` = CONVERT(BINARY(CONVERT(`notes` USING latin1)) USING utf8mb4)
WHERE HEX(`notes`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_quote` SET `platform_note` = CONVERT(BINARY(CONVERT(`platform_note` USING latin1)) USING utf8mb4)
WHERE HEX(`platform_note`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_quote_item` SET `product_name_snapshot` = CONVERT(BINARY(CONVERT(`product_name_snapshot` USING latin1)) USING utf8mb4)
WHERE HEX(`product_name_snapshot`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `dealer_address` SET `label` = CONVERT(BINARY(CONVERT(`label` USING latin1)) USING utf8mb4)
WHERE HEX(`label`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_address` SET `recipient_name` = CONVERT(BINARY(CONVERT(`recipient_name` USING latin1)) USING utf8mb4)
WHERE HEX(`recipient_name`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_address` SET `province` = CONVERT(BINARY(CONVERT(`province` USING latin1)) USING utf8mb4)
WHERE HEX(`province`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_address` SET `city` = CONVERT(BINARY(CONVERT(`city` USING latin1)) USING utf8mb4)
WHERE HEX(`city`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_address` SET `district` = CONVERT(BINARY(CONVERT(`district` USING latin1)) USING utf8mb4)
WHERE HEX(`district`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `dealer_address` SET `detail_address` = CONVERT(BINARY(CONVERT(`detail_address` USING latin1)) USING utf8mb4)
WHERE HEX(`detail_address`) REGEXP '^([0-9A-F]{2})*C3';

UPDATE `site_config` SET `config_value` = CONVERT(BINARY(CONVERT(`config_value` USING latin1)) USING utf8mb4)
WHERE HEX(`config_value`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `banner` SET `title` = CONVERT(BINARY(CONVERT(`title` USING latin1)) USING utf8mb4)
WHERE HEX(`title`) REGEXP '^([0-9A-F]{2})*C3';
