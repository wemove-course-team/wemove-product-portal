-- ========================================================
-- MVP-07 运营域增量迁移（#91）
-- 包含站点配置键值表与首页横幅表
-- 说明：执行后请勿修改本文件（决策 D6：只做增量迁移，不出现 DROP TABLE）
-- ========================================================

USE `wemove_portal`;

CREATE TABLE IF NOT EXISTS `site_config` (
  `config_key` VARCHAR(64) NOT NULL COMMENT '配置键（白名单：siteName/logoUrl/contactPhone/contactEmail/address/footerText/icpNo）',
  `config_value` VARCHAR(255) NOT NULL DEFAULT '' COMMENT '配置值',
  `updated_by` BIGINT DEFAULT NULL COMMENT '最后修改人 sys_user.id',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`config_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='站点配置（白名单键值对）';

CREATE TABLE IF NOT EXISTS `banner` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(128) NOT NULL COMMENT '横幅标题',
  `image_url` VARCHAR(255) NOT NULL COMMENT '图片：相对路径或 http(s) URL（决策 D10）',
  `link_url` VARCHAR(255) DEFAULT NULL COMMENT '跳转链接：相对路径或 http(s) URL',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序（小在前，同序按 id）',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否启用：1 启用，0 停用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_banner_sort` (`sort_order`, `id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='首页横幅';
