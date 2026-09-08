-- MVP-05 支持中心增量表。文件资源只引用 public 目录或外链，不做上传。
USE `wemove_portal`;

CREATE TABLE IF NOT EXISTS `contact_message` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `code` VARCHAR(32) NOT NULL COMMENT 'MSG-YYYYMMDD-NNNN',
  `dedupe_key` CHAR(64) NOT NULL,
  `name` VARCHAR(64) NOT NULL,
  `email` VARCHAR(128) NOT NULL,
  `phone` VARCHAR(32) DEFAULT NULL,
  `subject` VARCHAR(128) NOT NULL,
  `content` TEXT NOT NULL,
  `status` VARCHAR(16) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING/PROCESSING/DONE',
  `handle_note` VARCHAR(255) DEFAULT NULL,
  `handled_by` BIGINT DEFAULT NULL,
  `handled_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_contact_message_code` (`code`),
  UNIQUE KEY `uk_contact_message_dedupe_key` (`dedupe_key`),
  KEY `idx_contact_message_email_subject` (`email`, `subject`),
  KEY `idx_contact_message_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='联系表单留言';

CREATE TABLE IF NOT EXISTS `faq` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `question` VARCHAR(255) NOT NULL,
  `answer` TEXT NOT NULL,
  `category` VARCHAR(64) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_faq_category` (`category`),
  KEY `idx_faq_status_sort` (`status`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='常见问题';

CREATE TABLE IF NOT EXISTS `download_resource` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `title` VARCHAR(128) NOT NULL,
  `category` VARCHAR(64) NOT NULL DEFAULT 'manual',
  `description` VARCHAR(255) DEFAULT NULL,
  `file_url` VARCHAR(255) NOT NULL,
  `cover_image` VARCHAR(255) DEFAULT NULL,
  `visibility` VARCHAR(16) NOT NULL DEFAULT 'PUBLIC' COMMENT 'PUBLIC/USER/DEALER',
  `sort_order` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
  `download_count` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_download_category_visibility` (`category`, `visibility`),
  KEY `idx_download_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公开下载资源';

INSERT INTO `faq` (`question`, `answer`, `category`, `sort_order`, `status`) VALUES
('如何查看产品资料？', '在下载中心可以查看公开的电子说明书和产品资料。', '购买', 1, 'PUBLISHED'),
('如何申请成为经销商？', '登录后打开“成为经销商”，提交企业资料，审核通过后即可查看经销商门户。', '合作', 2, 'PUBLISHED'),
('提交留言后多久会处理？', '工作日通常会在一个工作日内处理，请保留留言编号以便查询。', '售后', 3, 'PUBLISHED');

INSERT INTO `download_resource` (`title`, `category`, `description`, `file_url`, `cover_image`, `visibility`, `sort_order`, `status`) VALUES
('WeMove 电子说明书示例', 'manual', '公开电子说明书资源示例。', '/images/electronic_grid0_0_1c281559-002.png', '/images/electronic_grid0_0_1c281559-002.png', 'PUBLIC', 1, 'PUBLISHED'),
('会员资料包', 'catalog', '登录后可访问。', '/images/electronic_grid1_0_c4ebc66c-1c4.png', '/images/electronic_grid1_0_c4ebc66c-1c4.png', 'USER', 2, 'PUBLISHED'),
('经销商资料包', 'dealer', '登录并通过经销商审核后可访问。', '/images/electronic_grid2_0_635fbdee-fe3.png', '/images/electronic_grid2_0_635fbdee-fe3.png', 'DEALER', 3, 'PUBLISHED');
