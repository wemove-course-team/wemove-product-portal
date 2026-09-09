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

UPDATE `site_config` SET `config_value` = CONVERT(BINARY(CONVERT(`config_value` USING latin1)) USING utf8mb4)
WHERE HEX(`config_value`) REGEXP '^([0-9A-F]{2})*C3';
UPDATE `banner` SET `title` = CONVERT(BINARY(CONVERT(`title` USING latin1)) USING utf8mb4)
WHERE HEX(`title`) REGEXP '^([0-9A-F]{2})*C3';
