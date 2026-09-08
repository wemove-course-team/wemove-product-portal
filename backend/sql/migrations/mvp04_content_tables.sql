-- ========================================================
-- MVP-04 内容域增量迁移（#88）
-- 包含文章分类、文章、栏目单页三张表
-- ========================================================

USE `wemove_portal`;

CREATE TABLE IF NOT EXISTS `article_category` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL,
  `slug` VARCHAR(64) NOT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章分类';

CREATE TABLE IF NOT EXISTS `article` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(128) NOT NULL,
  `slug` VARCHAR(128) NOT NULL,
  `category_id` BIGINT DEFAULT NULL,
  `cover_image` VARCHAR(255) DEFAULT NULL,
  `summary` VARCHAR(500) DEFAULT NULL,
  `content` MEDIUMTEXT,
  `status` VARCHAR(16) NOT NULL DEFAULT 'DRAFT' COMMENT 'DRAFT/PUBLISHED/OFFLINE',
  `published_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`),
  KEY `idx_category_status` (`category_id`, `status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='文章/新闻';

CREATE TABLE IF NOT EXISTS `page` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `slug` VARCHAR(64) NOT NULL COMMENT '对应前台栏目路由：furniture/woodlab/stem/library/charity/dream/electronic',
  `title` VARCHAR(128) NOT NULL,
  `sections_json` MEDIUMTEXT COMMENT '页面分块内容 JSON（结构沿用前端 pageSections.json）',
  `status` VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='栏目单页内容';
