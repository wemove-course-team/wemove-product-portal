-- ========================================================
-- MVP-03 产品域补充 seed（#87，可重复执行：ON DUPLICATE KEY UPDATE 幂等 upsert）
-- 依赖：init_schema_and_data.sql（基线）+ migrations/mvp03_catalog_incremental.sql
--
-- 背景：基线 5 款商品全部集中在「益智玩具」(category_id=1)。
-- 本文件补齐：
--   1) 前端既有假数据中的 4 款益智玩具（id 16-19，图片复用 /images/prod_16~19）
--   2) 家具定制 2 款可发布示例（category_id=2，图片复用 /images/furniture_*）
--   3) STEM 教育 2 款可发布示例（category_id=4，图片复用 /images/stem_*）
--   4) 1 款家具草稿（is_published=0，仅后台可见，用于“草稿不进入公开列表”验收演示）
-- 图片策略决策 D10：不做上传，全部引用 frontend/public/images/ 既有素材。
-- ========================================================

USE `wemove_portal`;
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ---------- 益智玩具（category_id=1）：同步前端旧假数据，消灭 localStorage 假数据 ----------
INSERT INTO `product`
  (`id`, `sku`, `name`, `slug`, `category_id`, `price`, `dealer_price`, `moq`, `age_range`, `material`, `scene`, `summary`, `description`, `images_json`, `specs_json`, `is_published`, `is_featured`, `tag`) VALUES
(16, 'WM-TRN-01', '小转盘机械传动套', 'turntable-set', 1, 168.00, 105.00, 15, '3-8岁', '纯天然榉木', '齿轮啮合 / 旋转机械',
 '适合低龄儿童的齿轮与转盘互动探索套件，手摇感受机械连动。',
 '大齿距实木齿轮，操作手感顺滑阻尼适中。引导孩子在手脑互动中建立齿轮传动与变速直观概念。',
 '["/images/prod_16_1.jpg", "/images/prod_16_2.jpg"]',
 '{"dimensions":"22cm x 22cm x 8cm","netWeight":"0.95 kg","packageDimensions":"24 x 24 x 10 cm","casePack":16,"includedItems":"转盘底座, 齿轮组, 摇柄, 说明手册"}',
 1, 0, '精细操作'),
(17, 'WM-LIFT-01', '垂直升降梯木制模型', 'elevator-model', 1, 248.00, 158.00, 10, '5-12岁', '实木 + 尼龙绳缆', '滑轮组省力机械 / 建筑联动',
 '经典滑轮升降机械结构，可与轨道套件无缝对接形成完整回环。',
 '通过手摇棘轮机构带动升降轿厢垂直运动，配有自动棘爪防滑落制动，生动还原现代工程电梯核心原理。',
 '["/images/prod_17_1.jpg", "/images/prod_17_2.jpg"]',
 '{"dimensions":"18cm x 14cm x 40cm","netWeight":"1.3 kg","packageDimensions":"42 x 16 x 12 cm","casePack":8,"includedItems":"升降导轨, 轿厢, 棘轮滑轮总成, 钢珠"}',
 1, 0, '场景拓展'),
(18, 'WM-MAG-01', '磁吸弹射轨道套件', 'magnetic-cannon', 1, 268.00, 172.00, 10, '6-14岁', '实木 + 强磁钕铁硼', '高斯加速原理 / 磁力发射',
 '结合强力磁铁与钢珠动量，展示令人惊叹的高斯磁力直线加速。',
 '当缓慢滚动的钢珠触碰磁铁后端时，前端钢珠以数倍速度瞬间弹射飞出！充满趣味与科学震撼力的经典物理木玩。',
 '["/images/prod_18_1.jpg", "/images/prod_18_2.jpg"]',
 '{"dimensions":"25cm x 6cm x 5cm","netWeight":"0.8 kg","packageDimensions":"28 x 8 x 6 cm","casePack":20,"includedItems":"木质加速槽, 强力磁体, 高精钢珠4颗, 靶标木块"}',
 1, 0, '高科技木玩'),
(19, 'WM-SNK-01', '蛇形仿生波浪轨道套装', 'snake-track-set', 1, 358.00, 228.00, 6, '4-12岁', '精制弹性实木曲条', '正弦波曲面 / 重力滑行',
 '优美起伏的连续正弦波木轨，提供极度治愈平稳的滚珠滑行视觉体验。',
 '采用高频弯曲成型工艺制作的波浪式轨道，滚珠滑行时产生富有节奏感的敲击木音，深受空间美学设计师与教育工作者喜爱。',
 '["/images/prod_19_1.jpg", "/images/prod_19_2.jpg"]',
 '{"dimensions":"68cm x 15cm x 18cm","netWeight":"2.2 kg","packageDimensions":"72 x 18 x 20 cm","casePack":4,"includedItems":"连续波浪曲轨, 起跑支架, 彩色滚珠8颗"}',
 1, 0, '艺术级美物')

ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`), `slug`=VALUES(`slug`), `category_id`=VALUES(`category_id`),
  `price`=VALUES(`price`), `dealer_price`=VALUES(`dealer_price`), `moq`=VALUES(`moq`),
  `age_range`=VALUES(`age_range`), `material`=VALUES(`material`), `scene`=VALUES(`scene`),
  `summary`=VALUES(`summary`), `description`=VALUES(`description`), `images_json`=VALUES(`images_json`),
  `specs_json`=VALUES(`specs_json`), `is_published`=VALUES(`is_published`), `is_featured`=VALUES(`is_featured`),
  `tag`=VALUES(`tag`);

-- ---------- 家具定制（category_id=2）：2 款可发布 + 1 款草稿 ----------
INSERT INTO `product`
  (`id`, `sku`, `name`, `slug`, `category_id`, `price`, `dealer_price`, `moq`, `age_range`, `material`, `scene`, `summary`, `description`, `images_json`, `specs_json`, `is_published`, `is_featured`, `tag`) VALUES
(110, 'WM-FUR-T01', '榫卯实木儿童学习桌椅套装', 'kids-study-desk-set', 2, 1680.00, 990.00, 4, '3-12岁', '北美进口白蜡木 / 水性环保漆', '家庭书房 / 儿童房定制 / 幼儿园活动室',
 '全榫卯结构学习桌椅套装，桌面高度与倾角可随孩子成长调节，天然原木无异味。',
 '整套装采用传统榫卯工艺连接，不用一颗螺丝，结构稳固耐久。桌面三档倾角调节，满足书写、阅读、绘画场景；桌腿预留成长孔位，随身高自由升降。表面涂覆食品级水性漆，边角全部手工倒圆。',
 '["/images/furniture_s0_f9590908-a1a.png", "/images/furniture_s1_17993665-0ba.png"]',
 '{"dimensions":"桌 110cm x 60cm x 52-76cm 可调","netWeight":"28.5 kg","packageDimensions":"118 x 66 x 18 cm","casePack":1,"includedItems":"学习桌 x1, 学习椅 x1, 阅读架 x1, 内六角扳手, 说明书"}',
 1, 1, '新品推荐'),
(111, 'WM-FUR-C02', '原木室内攀爬架运动组合', 'indoor-climbing-frame', 2, 2380.00, 1450.00, 2, '2-8岁', '欧洲榉木 + 棉绳 / 无蜡原木油', '家庭客厅 / 感统训练机构 / 亲子园所',
 '室内原木攀爬架组合，含攀爬梯、秋千与吊环模块，把运动场搬进客厅。',
 '主框架选用欧洲榉木层压材，极限承重 80kg，成人可陪同攀爬。模块化设计：攀爬梯、板秋千、吊环、滑梯四种组件可按空间自由组合更换。连接件全部内嵌螺母设计，无外露尖锐金属。',
 '["/images/furniture_s2_37cdc3f0-071.png", "/images/furniture_s3_a8a202fa-bf0.png"]',
 '{"dimensions":"组合占地 120cm x 90cm x 150cm","netWeight":"36 kg","packageDimensions":"125 x 45 x 25 cm","casePack":1,"includedItems":"主框架组件, 攀爬梯, 板秋千, 吊环, 棉绳配件包, 安装图纸"}',
 1, 0, '定制款'),
(190, 'WM-FUR-D99', '儿童实木书架定制（样例草稿）', 'custom-wooden-bookshelf', 2, 980.00, 620.00, 4, '3岁及以上', '俄罗斯桦木多层板', '儿童房 / 图书角定制',
 '（草稿示例）三层原木小书架，按空间尺寸定制，仅后台可见，不进入公开列表。',
 '本条为 MVP-03 验收演示草稿：验证“草稿/下架产品不进入公开列表”。后台发布后即可在官网与列表页展示。',
 '["/images/furniture_s4_b7120359-b98.png"]',
 '{"dimensions":"80cm x 28cm x 110cm","netWeight":"18 kg","packageDimensions":"86 x 34 x 14 cm","casePack":1,"includedItems":"层板 x3, 侧板 x2, 背板 x1, 连接件包"}',
 0, 0, '草稿')

ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`), `slug`=VALUES(`slug`), `category_id`=VALUES(`category_id`),
  `price`=VALUES(`price`), `dealer_price`=VALUES(`dealer_price`), `moq`=VALUES(`moq`),
  `age_range`=VALUES(`age_range`), `material`=VALUES(`material`), `scene`=VALUES(`scene`),
  `summary`=VALUES(`summary`), `description`=VALUES(`description`), `images_json`=VALUES(`images_json`),
  `specs_json`=VALUES(`specs_json`), `is_published`=VALUES(`is_published`), `is_featured`=VALUES(`is_featured`),
  `tag`=VALUES(`tag`);

-- ---------- STEM 教育（category_id=4）：2 款可发布 ----------
INSERT INTO `product`
  (`id`, `sku`, `name`, `slug`, `category_id`, `price`, `dealer_price`, `moq`, `age_range`, `material`, `scene`, `summary`, `description`, `images_json`, `specs_json`, `is_published`, `is_featured`, `tag`) VALUES
(120, 'WM-STM-S01', '重力滚珠物理实验教具箱', 'stem-physics-lab-box', 4, 458.00, 285.00, 6, '6-14岁', '实木组件 + 金属配重件', '科学课堂 / 机构教具 / 家庭实验室',
 '一箱整合斜面、滑轮、摆锤与滚珠轨道的物理实验教具箱，配套 12 课时探究手册。',
 '面向小学高年级至初中的实物探究教具：通过拼装斜面小车、滑轮组与钟摆装置，亲手验证加速度、省力比与单摆周期等规律。木制组件均预设标准孔位，可与 Cugolino 轨道系列通用扩展。配套教师用书与 12 课时探究任务单。',
 '["/images/stem_s0_3eea7200-6ed.jpg", "/images/stem_s3_44cb43d4-5ee.jpg"]',
 '{"dimensions":"教具箱 40cm x 30cm x 12cm","netWeight":"4.2 kg","packageDimensions":"42 x 32 x 14 cm","casePack":4,"includedItems":"木制实验组件 x36, 配重钢珠 x12, 滑轮组 x4, 课时手册 x1"}',
 1, 1, '进阶STEM'),
(121, 'WM-STM-C02', '数学几何磁力建构套装', 'stem-geometry-builder', 4, 328.00, 205.00, 8, '5-12岁', '实木几何块 + 安全磁力件', '数学启蒙 / 立体几何教学 / 亲子建构',
 '把平面图形搭成立体结构的磁力几何套装，直观理解点线面体与空间变换。',
 '包含 68 块榉木几何块与安全包边磁力连接件：三角形、正方形、正五边形等基础面片可磁性吸附，快速搭出柏拉图立体与空间桁架。配套挑战卡从平面拼图进阶到立体复制，适合数学启蒙与机构课堂分层教学。',
 '["/images/stem_s4_776a5140-3d7.jpg", "/images/stem_s5_965c2f3c-af6.jpg"]',
 '{"dimensions":"收纳盒 30cm x 22cm x 8cm","netWeight":"2.6 kg","packageDimensions":"32 x 24 x 10 cm","casePack":6,"includedItems":"几何木块 x68, 磁力连接件 x52, 挑战卡 x30, 收纳盒"}',
 1, 0, '新品推荐')

ON DUPLICATE KEY UPDATE
  `name`=VALUES(`name`), `slug`=VALUES(`slug`), `category_id`=VALUES(`category_id`),
  `price`=VALUES(`price`), `dealer_price`=VALUES(`dealer_price`), `moq`=VALUES(`moq`),
  `age_range`=VALUES(`age_range`), `material`=VALUES(`material`), `scene`=VALUES(`scene`),
  `summary`=VALUES(`summary`), `description`=VALUES(`description`), `images_json`=VALUES(`images_json`),
  `specs_json`=VALUES(`specs_json`), `is_published`=VALUES(`is_published`), `is_featured`=VALUES(`is_featured`),
  `tag`=VALUES(`tag`);
