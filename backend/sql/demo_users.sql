-- Local/demo accounts for Issue #90 manual verification only.
-- All three accounts use the password: 123456
USE `wemove_portal`;

INSERT INTO `sys_user`
  (`id`, `username`, `password_hash`, `real_name`, `email`, `phone`, `role`, `company_id`, `status`)
VALUES
  (9001, 'admin_demo', '$2b$10$O/7u4XBU4drECP7SKE4b8OXEitji9pEF9nvIJxVuP7Y.5c1lJKlZu', '演示管理员', 'admin_demo@example.com', NULL, 'ADMIN', NULL, 1),
  (9002, 'user_demo', '$2b$10$O/7u4XBU4drECP7SKE4b8OXEitji9pEF9nvIJxVuP7Y.5c1lJKlZu', '演示用户', 'user_demo@example.com', NULL, 'USER', NULL, 1),
  (9003, 'dealer_demo', '$2b$10$O/7u4XBU4drECP7SKE4b8OXEitji9pEF9nvIJxVuP7Y.5c1lJKlZu', '演示经销商', 'dealer_demo@example.com', NULL, 'DEALER', 1, 1)
ON DUPLICATE KEY UPDATE
  `password_hash` = VALUES(`password_hash`),
  `role` = VALUES(`role`),
  `company_id` = VALUES(`company_id`),
  `status` = VALUES(`status`);
