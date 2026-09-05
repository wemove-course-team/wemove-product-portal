-- ========================================================
-- WEMOVE SPORTS 惟木匠心 - 数据库初始化脚本
-- 适用于 MySQL 8.0+
-- ========================================================

CREATE DATABASE IF NOT EXISTS `wemove_portal` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `wemove_portal`;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. 用户与身份表
DROP TABLE IF EXISTS `sys_user`;
CREATE TABLE `sys_user` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `username` VARCHAR(64) NOT NULL COMMENT '用户名/登录名',
  `password_hash` VARCHAR(255) NOT NULL COMMENT '加密密码',
  `real_name` VARCHAR(64) DEFAULT NULL COMMENT '真实姓名',
  `email` VARCHAR(128) NOT NULL COMMENT '电子邮箱',
  `phone` VARCHAR(32) DEFAULT NULL COMMENT '手机号',
  `role` VARCHAR(32) NOT NULL DEFAULT 'USER' COMMENT '角色: GUEST, USER, DEALER, ADMIN',
  `company_id` BIGINT DEFAULT NULL COMMENT '关联经销商企业ID',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态: 1正常, 0禁用',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_username` (`username`),
  UNIQUE KEY `uk_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统用户表';

-- 2. 经销商企业表
DROP TABLE IF EXISTS `dealer_company`;
CREATE TABLE `dealer_company` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `company_name` VARCHAR(128) NOT NULL COMMENT '企业全称',
  `tax_id` VARCHAR(64) NOT NULL COMMENT '统一社会信用代码',
  `business_type` VARCHAR(64) NOT NULL COMMENT '机构性质',
  `region` VARCHAR(128) NOT NULL COMMENT '授权销售区域',
  `tier_name` VARCHAR(64) NOT NULL DEFAULT '二级特约经销商' COMMENT '授权等级',
  `discount_rate` DECIMAL(4,2) NOT NULL DEFAULT 0.75 COMMENT '结算折扣率(例如0.65表示6.5折)',
  `contact_name` VARCHAR(64) NOT NULL COMMENT '商务对接人',
  `contact_phone` VARCHAR(32) NOT NULL COMMENT '对接电话',
  `contact_email` VARCHAR(128) NOT NULL COMMENT '对接邮箱',
  `status` VARCHAR(32) NOT NULL DEFAULT 'ACTIVE' COMMENT '状态: ACTIVE, SUSPENDED, CLOSED',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_tax_id` (`tax_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经销商企业表';

-- 3. 经销商在线申请工单表
DROP TABLE IF EXISTS `dealer_application`;
CREATE TABLE `dealer_application` (
  `id` VARCHAR(32) NOT NULL COMMENT '申请单号 (APP-2026-XXXX)',
  `company_name` VARCHAR(128) NOT NULL,
  `tax_id` VARCHAR(64) NOT NULL,
  `business_type` VARCHAR(64) NOT NULL,
  `region` VARCHAR(128) NOT NULL,
  `contact_name` VARCHAR(64) NOT NULL,
  `phone` VARCHAR(32) NOT NULL,
  `email` VARCHAR(128) NOT NULL,
  `annual_target` VARCHAR(64) NOT NULL,
  `sales_channels` TEXT,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PENDING' COMMENT 'PENDING, APPROVED, REJECTED',
  `tier_name` VARCHAR(64) DEFAULT NULL,
  `discount_rate` DECIMAL(4,2) DEFAULT NULL,
  `audit_note` VARCHAR(255) DEFAULT NULL,
  `audited_at` DATETIME DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='经销商入驻申请表';

-- 4. 商品分类表
DROP TABLE IF EXISTS `product_category`;
CREATE TABLE `product_category` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(64) NOT NULL COMMENT '分类名称',
  `slug` VARCHAR(64) NOT NULL COMMENT '路由标识',
  `description` VARCHAR(255) DEFAULT NULL,
  `sort_order` INT NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品分类表';

-- 5. 商品主数据表
DROP TABLE IF EXISTS `product`;
CREATE TABLE `product` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `sku` VARCHAR(64) NOT NULL COMMENT 'SKU',
  `name` VARCHAR(128) NOT NULL COMMENT '商品名称',
  `slug` VARCHAR(128) NOT NULL,
  `category_id` BIGINT NOT NULL,
  `price` DECIMAL(10,2) NOT NULL COMMENT '官方零售指导价',
  `dealer_price` DECIMAL(10,2) NOT NULL COMMENT '基准批发价',
  `moq` INT NOT NULL DEFAULT 10 COMMENT '经销商最低起订量',
  `age_range` VARCHAR(64) DEFAULT NULL COMMENT '建议年龄',
  `material` VARCHAR(128) DEFAULT NULL COMMENT '主要材质',
  `scene` VARCHAR(255) DEFAULT NULL COMMENT '适用场景',
  `summary` VARCHAR(500) DEFAULT NULL,
  `description` TEXT,
  `images_json` TEXT COMMENT '多图URL数组JSON',
  `specs_json` TEXT COMMENT '规格参数JSON',
  `is_published` TINYINT NOT NULL DEFAULT 1,
  `is_featured` TINYINT NOT NULL DEFAULT 0,
  `tag` VARCHAR(32) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- 6. 订单表
DROP TABLE IF EXISTS `orders`;
CREATE TABLE `orders` (
  `id` VARCHAR(32) NOT NULL COMMENT '订单编号 ORD-YYYYMM-XXXXX',
  `order_type` VARCHAR(32) NOT NULL COMMENT 'B2C, B2B',
  `user_id` BIGINT DEFAULT NULL,
  `customer_name` VARCHAR(64) NOT NULL,
  `customer_company` VARCHAR(128) DEFAULT NULL,
  `customer_phone` VARCHAR(32) NOT NULL,
  `customer_address` VARCHAR(255) NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(32) NOT NULL,
  `status` VARCHAR(32) NOT NULL DEFAULT 'PAID' COMMENT 'PENDING_PAYMENT, PAID, CONFIRMED, SHIPPED, COMPLETED',
  `tracking_no` VARCHAR(64) DEFAULT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';

-- 7. 订单明细项表
DROP TABLE IF EXISTS `order_item`;
CREATE TABLE `order_item` (
  `id` BIGINT NOT NULL AUTO_INCREMENT,
  `order_id` VARCHAR(32) NOT NULL,
  `product_id` BIGINT NOT NULL,
  `sku` VARCHAR(64) NOT NULL,
  `product_name` VARCHAR(128) NOT NULL,
  `unit_price` DECIMAL(10,2) NOT NULL,
  `quantity` INT NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单明细表';

-- ========================================================
-- 初始基础数据预置 (种子数据)
-- ========================================================

-- 插入分类
INSERT INTO `product_category` (`id`, `name`, `slug`, `description`, `sort_order`) VALUES
(1, '益智玩具', 'workshop', '动手创造，在木工中学习工程思维与创意设计', 1),
(2, '家具定制', 'furniture', '天然原木全屋定制，大师设计传承榫卯', 2),
(3, '中试打样', 'woodlab', '高校与机构研发打样，感受自然材料温度', 3),
(4, 'STEM教育', 'stem', '科学工程数学实践，玩中培养综合素养', 4),
(5, '创意套件', 'kits', '精选主题玩具套件，一站式亲子创造体验', 5);

-- 插入核心商品
INSERT INTO `product` (`id`, `sku`, `name`, `slug`, `category_id`, `price`, `dealer_price`, `moq`, `age_range`, `material`, `scene`, `summary`, `description`, `images_json`, `specs_json`, `is_published`, `is_featured`, `tag`) VALUES
(101, 'WM-BWL-01', '儿童实木保龄球套装 (Mini Bowling Set)', 'kids-bowling-set', 1, 198.00, 118.00, 10, '3-10岁', '天然优质实木 / 水性环保漆', '室内亲子 / 幼儿园活动 / 运动协调', 'WEMOVE SPORTS 经典运动玩具，含10个木质球瓶与2个保龄球，锻炼儿童手眼协调。', '高品质实木打磨，边缘光滑无毛刺，配置便携网袋，适合家庭与幼教机构。', '["/images/prod_20_1.jpg", "/images/prod_14_1.jpg"]', '{"dimensions":"球瓶 18cm x 5.5cm, 球体 直径 7.5cm","netWeight":"1.45 kg","casePack":12}', 1, 1, '热销爆款'),
(102, 'WM-BLC-02', '极简弧形摇摆平衡板 (Wobble Balance Board)', 'wooden-balance-board', 1, 268.00, 160.00, 6, '3岁及以上 (承重120kg)', '高强度多层天然桦木', '体能感统训练 / 瑜伽拉伸 / 创意开放式玩法', '多功能开放式运动玩具，可作平衡板、摇摆椅、小滑梯或阅读拱桥。', '一体热压成形，表面手工打磨，承重达120kg，大人儿童皆可一同互动。', '["/images/prod_19_1.jpg", "/images/prod_19_2.jpg"]', '{"dimensions":"83cm x 30cm x 1.8cm","netWeight":"3.1 kg","casePack":6}', 1, 1, '新品推荐'),
(20, 'WM-BLK-50', '50块标准款实木积木套装', '50-wooden-blocks', 1, 198.00, 128.00, 12, '3-8岁', '德国AA级天然榉木', '空间建构 / 建筑启蒙 / 精细动作', '德国AA级榉木精选，经典标准几何结构。', '选用天然榉木精制，质感温润细腻，涵盖立方体、圆柱、三角等几何体。', '["/images/prod_20_1.jpg"]', '{"dimensions":"4cm x 4cm x 4cm","netWeight":"2.1 kg","casePack":8}', 1, 1, '经典常青'),
(14, 'WM-CUG-01', 'Cugolino Basic 滚珠轨道启智套件', 'cugolino-basic', 1, 328.00, 210.00, 8, '4-10岁', '实木榉木 + 彩色环保漆', '重力势能探索 / 轨道拼装', '入门级滚珠轨道搭建系统，直观感受重力加速度与空间拓扑。', '精巧的凹槽与孔道设计，配合彩色积木块，支持成百上千种轨道设计。', '["/images/prod_14_1.jpg", "/images/prod_14_2.jpg"]', '{"dimensions":"5cm基准","netWeight":"2.8 kg","casePack":6}', 1, 1, '高好评'),
(15, 'WM-PND-01', '大摆锤重力动力套件', 'pendulum-set', 1, 288.00, 185.00, 10, '5-12岁', '实木机械部件 + 黄铜轴承', '物理机械实验 / 动量守恒', '将物理机械传动融入木玩，展示钟摆摆动与动能传递的迷人规律。', '精密打磨木制连杆配合高精度微型轴承，轻推即可长时间平稳摆动。', '["/images/prod_15_1.jpg", "/images/prod_15_2.jpg"]', '{"dimensions":"26cm x 15cm x 32cm","netWeight":"1.6 kg","casePack":10}', 1, 0, '进阶STEM');

-- 插入演示用经销商企业与申请
INSERT INTO `dealer_company` (`id`, `company_name`, `tax_id`, `business_type`, `region`, `tier_name`, `discount_rate`, `contact_name`, `contact_phone`, `contact_email`, `status`) VALUES
(1, '上海晨星益智玩具有限公司', '91310115MA1KXXXX01', '线下母婴及连锁玩具店', '华东大区 (上海/江苏/浙江)', '一级核心经销商', 0.65, '李经理', '13812345678', 'dealer@starwood.com', 'ACTIVE');

INSERT INTO `dealer_application` (`id`, `company_name`, `tax_id`, `business_type`, `region`, `contact_name`, `phone`, `email`, `annual_target`, `sales_channels`, `status`, `tier_name`, `discount_rate`, `audit_note`) VALUES
('APP-2026-0891', '上海晨星益智玩具有限公司', '91310115MA1KXXXX01', '线下母婴及连锁玩具店', '华东大区 (上海/江苏/浙江)', '李经理', '13812345678', 'dealer@starwood.com', '50-100万', '实体专卖店、私域团购', 'APPROVED', '一级核心经销商', 0.65, '资质优异，首单100件门槛'),
('APP-2026-0902', '广州木语启智科教发展有限公司', '91440101MA59XXXX88', 'STEM幼儿园教具采购', '华南大区', '陈总监', '13988776655', 'chen@muyu-edu.cn', '100-300万', '公立/国际学校招标采购', 'PENDING', '待定', 0.75, '待运营人员电话审核');

SET FOREIGN_KEY_CHECKS = 1;
