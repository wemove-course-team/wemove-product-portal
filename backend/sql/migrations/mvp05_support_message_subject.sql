CREATE TABLE IF NOT EXISTS `support_messages` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `ticket_no` varchar(32) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `status` enum('pending', 'processed') NOT NULL DEFAULT 'pending',
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  UNIQUE INDEX `IDX_support_messages_ticket_no` (`ticket_no`),
  INDEX `IDX_support_messages_email` (`email`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `support_faqs` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `question` varchar(255) NOT NULL,
  `answer` text NOT NULL,
  `sort_order` int NOT NULL DEFAULT 0,
  `is_published` boolean NOT NULL DEFAULT true,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `IDX_support_faqs_category` (`category`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `support_manuals` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `title` varchar(255) NOT NULL,
  `description` text NULL,
  `file_url` varchar(500) NOT NULL,
  `file_size` int NOT NULL COMMENT 'File size in bytes',
  `visibility` enum('PUBLIC', 'USER', 'DEALER') NOT NULL DEFAULT 'PUBLIC',
  `is_published` boolean NOT NULL DEFAULT true,
  `created_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  `updated_at` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
  INDEX `IDX_support_manuals_visibility` (`visibility`),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;