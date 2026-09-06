-- ========================================================
-- MVP-03 演示账号 seed（#87 联调用，可重复执行：ON DUPLICATE KEY UPDATE 幂等）
--
-- ⚠️ 临时实现：正式账号体系（注册/找回/用户管理）由 #85 MVP-01 交付，
--    本文件仅提供 dev-auth 最小登录所需的三个演示账号（#85 issue 评论约定），
--    #85 合并时可保留或替换本文件。
--
-- 演示口令（仅本地演示环境使用）：Wemove@123
--   - admin       → ADMIN（后台产品/分类管理）
--   - demo_user   → USER（普通注册用户）
--   - dealer_demo → DEALER（company_id=1，对应基线 seed 的上海晨星益智玩具有限公司）
-- 哈希为 bcrypt(cost=10)，明文口令不入库不提交。
-- ========================================================

USE `wemove_portal`;

INSERT INTO `sys_user` (`username`, `password_hash`, `real_name`, `email`, `phone`, `role`, `company_id`, `status`) VALUES
('admin', '$2a$10$uKF34.jKH7gQvk.oa7tWWu9jHQgH7UarEFSazq/S/UUJb9FC5JEyi', '系统管理员', 'admin@wemovetoy.com', '13800000001', 'ADMIN', NULL, 1),
('demo_user', '$2a$10$uKF34.jKH7gQvk.oa7tWWu9jHQgH7UarEFSazq/S/UUJb9FC5JEyi', '演示用户', 'demo_user@wemovetoy.com', '13800000002', 'USER', NULL, 1),
('dealer_demo', '$2a$10$uKF34.jKH7gQvk.oa7tWWu9jHQgH7UarEFSazq/S/UUJb9FC5JEyi', '李经理', 'dealer@starwood.com', '13812345678', 'DEALER', 1, 1)
ON DUPLICATE KEY UPDATE
  `password_hash`=VALUES(`password_hash`),
  `real_name`=VALUES(`real_name`),
  `email`=VALUES(`email`),
  `phone`=VALUES(`phone`),
  `role`=VALUES(`role`),
  `company_id`=VALUES(`company_id`),
  `status`=VALUES(`status`);
