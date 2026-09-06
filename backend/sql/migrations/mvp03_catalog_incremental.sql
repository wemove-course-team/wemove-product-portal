-- ========================================================
-- MVP-03 产品域增量迁移（#87，一次性执行，执行后请勿修改本文件）
-- 依赖基线：backend/sql/init_schema_and_data.sql（决策 D6：基线冻结）
--
-- 内容：
--   1) product.updated_at —— 后台“最近修改”排序与展示需要
--   2) product.uk_slug    —— 验收要求 slug 全局唯一（基线只有 uk_sku）
--   3) product_category.uk_slug —— /categories/:slug 寻址前提（基线无唯一索引）
-- 说明：MySQL 8 不支持 ADD COLUMN/INDEX IF NOT EXISTS，重复执行会报
--       Duplicate column/index 错误，属预期（迁移按序执行一次）。
-- ========================================================

USE `wemove_portal`;

ALTER TABLE `product`
  ADD COLUMN `updated_at` DATETIME NOT NULL
    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间';

ALTER TABLE `product`
  ADD UNIQUE KEY `uk_slug` (`slug`);

ALTER TABLE `product_category`
  ADD UNIQUE KEY `uk_slug` (`slug`);
