-- MVP-08 经销商工作台演示数据：仅服务课程验收账号，使用幂等写入。
USE `wemove_portal`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

UPDATE `dealer_company`
SET `payment_terms` = '预付 50%，发货前付清',
    `currency` = 'CNY',
    `account_manager` = '王经理'
WHERE `id` = 1;

INSERT INTO `dealer_address`
(`id`, `company_id`, `label`, `recipient_name`, `phone`, `province`, `city`, `district`, `detail_address`, `address_type`, `is_default`)
VALUES
(1, 1, '上海总部', '李经理', '13812345678', '上海市', '上海市', '浦东新区', '张江路 88 号晨星大厦 6 楼', 'SHIPPING', 1),
(2, 1, '财务开票地址', '周会计', '13812345679', '上海市', '上海市', '浦东新区', '张江路 88 号晨星大厦 6 楼财务部', 'BILLING', 1)
ON DUPLICATE KEY UPDATE
  `label` = VALUES(`label`), `recipient_name` = VALUES(`recipient_name`), `phone` = VALUES(`phone`),
  `detail_address` = VALUES(`detail_address`), `address_type` = VALUES(`address_type`), `is_default` = VALUES(`is_default`);

INSERT INTO `dealer_quote`
(`id`, `quote_no`, `company_id`, `created_by`, `status`, `requested_delivery_date`, `valid_until`, `notes`, `platform_note`, `total_amount`, `created_at`)
VALUES (1, 'QUO-202609-0001', 1, NULL, 'QUOTED', '2026-09-30', '2026-09-20', '华东门店秋季补货', '价格含税，不含跨省物流费用。', 8760.00, '2026-09-08 10:00:00')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `valid_until` = VALUES(`valid_until`), `total_amount` = VALUES(`total_amount`);

INSERT INTO `dealer_quote_item`
(`id`, `quote_id`, `product_id`, `sku_snapshot`, `product_name_snapshot`, `quantity`, `unit_price`, `subtotal`)
VALUES
(1, 1, 101, 'WM-BWL-01', '儿童实木保龄球套装', 30, 118.00, 3540.00),
(2, 1, 102, 'WM-BLC-02', '极简弧形摇摆平衡板', 24, 160.00, 3840.00)
ON DUPLICATE KEY UPDATE `quantity` = VALUES(`quantity`), `unit_price` = VALUES(`unit_price`), `subtotal` = VALUES(`subtotal`);

INSERT INTO `orders`
(`id`, `order_type`, `user_id`, `company_id`, `customer_name`, `customer_company`, `customer_phone`, `customer_address`, `total_amount`, `payment_method`, `po_number`, `requested_delivery_date`, `notes`, `status`, `tracking_no`, `created_at`)
VALUES ('ORD-202609-0001', 'B2B', NULL, 1, '李经理', '上海晨星益智玩具有限公司', '13812345678', '上海市浦东新区张江路 88 号', 6100.00, 'BANK_TRANSFER', 'PO-STAR-20260901', '2026-09-18', '门店开业补货', 'SHIPPED', 'SF1234567890', '2026-09-01 09:30:00')
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `tracking_no` = VALUES(`tracking_no`), `updated_at` = CURRENT_TIMESTAMP;

INSERT INTO `order_item`
(`order_id`, `product_id`, `sku`, `product_name`, `unit_price`, `quantity`, `subtotal`)
SELECT 'ORD-202609-0001', 101, 'WM-BWL-01', '儿童实木保龄球套装', 118.00, 30, 3540.00
WHERE NOT EXISTS (SELECT 1 FROM `order_item` WHERE `order_id` = 'ORD-202609-0001' AND `product_id` = 101);

INSERT INTO `order_item`
(`order_id`, `product_id`, `sku`, `product_name`, `unit_price`, `quantity`, `subtotal`)
SELECT 'ORD-202609-0001', 102, 'WM-BLC-02', '极简弧形摇摆平衡板', 160.00, 16, 2560.00
WHERE NOT EXISTS (SELECT 1 FROM `order_item` WHERE `order_id` = 'ORD-202609-0001' AND `product_id` = 102);

INSERT INTO `dealer_invoice`
(`id`, `invoice_no`, `company_id`, `order_id`, `status`, `amount`, `issued_at`, `due_at`, `file_url`)
VALUES
(1, 'INV-202609-0001', 1, 'ORD-202609-0001', 'ISSUED', 6100.00, '2026-09-02 10:00:00', '2026-09-16 23:59:59', NULL)
ON DUPLICATE KEY UPDATE `status` = VALUES(`status`), `amount` = VALUES(`amount`), `due_at` = VALUES(`due_at`);
