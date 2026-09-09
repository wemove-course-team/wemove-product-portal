-- ========================================================
-- MVP-07 运营域 seed（幂等：ON DUPLICATE KEY UPDATE）
-- 提供站点配置默认值与少量演示 Banner，仅图片引用公开静态资源（决策 D10）。
-- ========================================================

USE `wemove_portal`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 站点配置默认值（白名单键：siteName/logoUrl/contactPhone/contactEmail/address/footerText/icpNo）
INSERT INTO `site_config` (`config_key`, `config_value`) VALUES
('siteName', 'WEMOVE 惟木匠心'),
('logoUrl', ''),
('contactPhone', ''),
('contactEmail', ''),
('address', ''),
('footerText', '© 2026 WEMOVE 惟木匠心'),
('icpNo', '')
ON DUPLICATE KEY UPDATE `config_key` = VALUES(`config_key`);

-- 演示 Banner（空表时插入；已有数据不覆盖）
INSERT INTO `banner` (`title`, `image_url`, `link_url`, `sort_order`, `is_active`)
SELECT * FROM (
  SELECT '儿童实木保龄球套装' AS title, '/images/prod_20_1.jpg' AS image_url, '/products' AS link_url, 10 AS sort_order, 1 AS is_active
  UNION ALL
  SELECT '极简弧形摇摆平衡板', '/images/prod_19_1.jpg', '/products', 20, 1
) AS src
WHERE NOT EXISTS (SELECT 1 FROM `banner`);
