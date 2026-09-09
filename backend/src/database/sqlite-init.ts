import sqlite3 from 'sqlite3'
import path from 'path'
import fs from 'fs'

export type SqliteInitOptions = {
  /**
   * 是否写入演示种子数据（含公开密码的 admin / dealer_demo 账号）。
   * 生产环境必须传 false，见 db-config.ts 的 fail fast 约束。
   */
  seedDemoData?: boolean
}

export async function ensureSqliteDatabase(dbFilePath: string, options: SqliteInitOptions = {}): Promise<void> {
  const seedDemoData = options.seedDemoData !== false
  const dir = path.dirname(dbFilePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const db = new sqlite3.Database(dbFilePath)

  const runQuery = (sql: string, params: any[] = []): Promise<any> => {
    return new Promise((resolve, reject) => {
      db.run(sql, params, function (err) {
        if (err) return reject(err)
        resolve(this)
      })
    })
  }

  const getRows = (sql: string, params: any[] = []): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      db.all(sql, params, (err, rows) => {
        if (err) return reject(err)
        resolve(rows || [])
      })
    })
  }

  const execSql = (sql: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      db.exec(sql, (err) => {
        if (err) return reject(err)
        resolve()
      })
    })
  }

  try {
    // 1. 创建表结构
    await execSql(`
      CREATE TABLE IF NOT EXISTS sys_user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username VARCHAR(64) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        real_name VARCHAR(64) DEFAULT NULL,
        email VARCHAR(128) NOT NULL UNIQUE,
        phone VARCHAR(32) DEFAULT NULL,
        role VARCHAR(32) NOT NULL DEFAULT 'USER',
        company_id BIGINT DEFAULT NULL,
        dealer_member_role VARCHAR(32) DEFAULT 'OWNER',
        status TINYINT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dealer_company (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_name VARCHAR(128) NOT NULL,
        tax_id VARCHAR(64) NOT NULL UNIQUE,
        business_type VARCHAR(64) NOT NULL,
        region VARCHAR(128) NOT NULL,
        tier_name VARCHAR(64) NOT NULL DEFAULT '二级特约经销商',
        discount_rate DECIMAL(4,2) NOT NULL DEFAULT 0.75,
        payment_terms VARCHAR(128) NOT NULL DEFAULT '预付款',
        currency VARCHAR(8) NOT NULL DEFAULT 'CNY',
        account_manager VARCHAR(64) DEFAULT '王专属顾问',
        contact_name VARCHAR(64) NOT NULL,
        contact_phone VARCHAR(32) NOT NULL,
        contact_email VARCHAR(128) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dealer_application (
        id VARCHAR(32) PRIMARY KEY NOT NULL,
        user_id BIGINT NULL,
        company_name VARCHAR(128) NOT NULL,
        tax_id VARCHAR(64) NOT NULL,
        business_type VARCHAR(64) NOT NULL,
        region VARCHAR(128) NOT NULL,
        contact_name VARCHAR(64) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        email VARCHAR(128) NOT NULL,
        annual_target VARCHAR(64) NOT NULL,
        sales_channels TEXT,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        tier_name VARCHAR(64) DEFAULT NULL,
        discount_rate DECIMAL(4,2) DEFAULT NULL,
        audit_note VARCHAR(255) DEFAULT NULL,
        audited_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS product_category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(64) NOT NULL,
        slug VARCHAR(64) NOT NULL,
        description VARCHAR(255) DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS product (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sku VARCHAR(64) NOT NULL UNIQUE,
        name VARCHAR(128) NOT NULL,
        slug VARCHAR(128) NOT NULL,
        category_id BIGINT NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        dealer_price DECIMAL(10,2) NOT NULL,
        moq INT NOT NULL DEFAULT 10,
        age_range VARCHAR(64) DEFAULT NULL,
        material VARCHAR(128) DEFAULT NULL,
        scene VARCHAR(255) DEFAULT NULL,
        summary VARCHAR(500) DEFAULT NULL,
        description TEXT,
        images_json TEXT,
        specs_json TEXT,
        is_published TINYINT NOT NULL DEFAULT 1,
        is_featured TINYINT NOT NULL DEFAULT 0,
        tag VARCHAR(32) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS password_reset_token (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id BIGINT NOT NULL,
        token_hash VARCHAR(128) NOT NULL,
        expires_at DATETIME NOT NULL,
        used_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS article_category (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name VARCHAR(64) NOT NULL,
        slug VARCHAR(64) NOT NULL UNIQUE,
        sort_order INT NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS article (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category_id BIGINT,
        title VARCHAR(128) NOT NULL,
        slug VARCHAR(128) NOT NULL UNIQUE,
        cover_image VARCHAR(255) DEFAULT NULL,
        summary VARCHAR(500) DEFAULT NULL,
        content TEXT,
        status VARCHAR(16) NOT NULL DEFAULT 'DRAFT',
        published_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS page (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug VARCHAR(64) NOT NULL UNIQUE,
        title VARCHAR(128) NOT NULL,
        sections_json TEXT,
        status VARCHAR(16) NOT NULL DEFAULT 'PUBLISHED',
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS contact_message (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code VARCHAR(32) NOT NULL UNIQUE,
        name VARCHAR(64) NOT NULL,
        email VARCHAR(128) NOT NULL,
        phone VARCHAR(32) DEFAULT NULL,
        subject VARCHAR(128) NOT NULL,
        content TEXT NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        handle_note VARCHAR(255) DEFAULT NULL,
        handled_by BIGINT DEFAULT NULL,
        handled_at DATETIME DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS faq (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question VARCHAR(255) NOT NULL,
        answer TEXT NOT NULL,
        category VARCHAR(64) DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS download_resource (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(128) NOT NULL,
        category VARCHAR(64) NOT NULL DEFAULT 'manual',
        description VARCHAR(255) DEFAULT NULL,
        file_url VARCHAR(255) NOT NULL,
        cover_image VARCHAR(255) DEFAULT NULL,
        visibility VARCHAR(32) NOT NULL DEFAULT 'PUBLIC',
        sort_order INT NOT NULL DEFAULT 0,
        status VARCHAR(32) NOT NULL DEFAULT 'PUBLISHED',
        download_count INT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS site_config (
        config_key VARCHAR(64) PRIMARY KEY NOT NULL,
        config_value VARCHAR(255) NOT NULL DEFAULT '',
        updated_by BIGINT DEFAULT NULL,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS banner (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title VARCHAR(128) NOT NULL,
        image_url VARCHAR(255) NOT NULL,
        link_url VARCHAR(255) DEFAULT NULL,
        sort_order INT NOT NULL DEFAULT 0,
        is_active TINYINT NOT NULL DEFAULT 1,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dealer_quote (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_no VARCHAR(32) NOT NULL UNIQUE,
        company_id BIGINT NOT NULL,
        created_by BIGINT DEFAULT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'SUBMITTED',
        requested_delivery_date DATE DEFAULT NULL,
        valid_until DATE DEFAULT NULL,
        notes VARCHAR(1000) DEFAULT NULL,
        platform_note VARCHAR(1000) DEFAULT NULL,
        total_amount DECIMAL(12,2) DEFAULT NULL,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS dealer_quote_item (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        quote_id BIGINT NOT NULL,
        product_id BIGINT NOT NULL,
        sku_snapshot VARCHAR(64) NOT NULL,
        product_name_snapshot VARCHAR(128) NOT NULL,
        quantity INT NOT NULL,
        unit_price DECIMAL(10,2) DEFAULT NULL,
        subtotal DECIMAL(12,2) DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS dealer_invoice (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no VARCHAR(32) NOT NULL UNIQUE,
        company_id BIGINT NOT NULL,
        order_id VARCHAR(32) NOT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'ISSUED',
        amount DECIMAL(12,2) NOT NULL,
        issued_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        due_at DATETIME DEFAULT NULL,
        file_url VARCHAR(255) DEFAULT NULL
      );

      CREATE TABLE IF NOT EXISTS dealer_address (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        company_id BIGINT NOT NULL,
        label VARCHAR(64) NOT NULL,
        recipient_name VARCHAR(64) NOT NULL,
        phone VARCHAR(32) NOT NULL,
        province VARCHAR(64) NOT NULL,
        city VARCHAR(64) NOT NULL,
        district VARCHAR(64) NOT NULL,
        detail_address VARCHAR(255) NOT NULL,
        address_type VARCHAR(32) NOT NULL DEFAULT 'SHIPPING',
        is_default TINYINT NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(32) PRIMARY KEY NOT NULL,
        order_type VARCHAR(32) NOT NULL,
        user_id BIGINT DEFAULT NULL,
        company_id BIGINT DEFAULT NULL,
        customer_name VARCHAR(64) NOT NULL,
        customer_company VARCHAR(128) DEFAULT NULL,
        customer_phone VARCHAR(32) NOT NULL,
        customer_address VARCHAR(255) NOT NULL,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(32) DEFAULT NULL,
        tracking_no VARCHAR(64) DEFAULT NULL,
        po_number VARCHAR(64) DEFAULT NULL,
        requested_delivery_date DATE DEFAULT NULL,
        notes VARCHAR(1000) DEFAULT NULL,
        status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_item (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id VARCHAR(32) NOT NULL,
        product_id BIGINT NOT NULL,
        sku VARCHAR(64) NOT NULL,
        product_name VARCHAR(128) NOT NULL,
        unit_price DECIMAL(10,2) NOT NULL,
        quantity INT NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL
      );
    `)

    // 1.1 兼容既有 SQLite 文件：补齐实体与 MySQL 基线新增的列（CREATE TABLE IF NOT EXISTS 不会改表）
    const columnExists = async (table: string, column: string): Promise<boolean> => {
      const columns = await getRows(`PRAGMA table_info(${table})`)
      return columns.some((row: any) => String(row.name) === column)
    }

    const addColumnIfMissing = async (table: string, column: string, ddl: string): Promise<void> => {
      if (await columnExists(table, column)) return
      await execSql(`ALTER TABLE ${table} ADD COLUMN ${ddl}`)
      console.log(`[wemove-sqlite] migrated: ${table}.${column} added`)
    }

    // 经销商申请绑定登录用户（sql/migrations/mvp06_dealer_application_user.sql）
    await addColumnIfMissing('dealer_application', 'user_id', 'user_id BIGINT NULL')
    await execSql('CREATE INDEX IF NOT EXISTS idx_dealer_application_user_id ON dealer_application (user_id)')

    // 找回密码令牌只存哈希（sql/migrations/mvp01_identity_password_reset.sql）
    await addColumnIfMissing('password_reset_token', 'token_hash', "token_hash VARCHAR(128) NOT NULL DEFAULT ''")
    // 老库存在明文 token 列时迁移为哈希；新库没有该列，跳过以免报错
    if (await columnExists('password_reset_token', 'token')) {
      await runQuery(
        "UPDATE password_reset_token SET token_hash = token WHERE (token_hash IS NULL OR token_hash = '') AND token IS NOT NULL"
      )
    }
    // 无法迁移的历史明文令牌不可再用，直接清理，避免唯一索引冲突
    await runQuery("DELETE FROM password_reset_token WHERE token_hash IS NULL OR token_hash = ''")
    await execSql('CREATE UNIQUE INDEX IF NOT EXISTS uk_password_reset_token_hash ON password_reset_token (token_hash)')
    await execSql('CREATE INDEX IF NOT EXISTS idx_password_reset_user_id ON password_reset_token (user_id)')

    // 订单主表对齐 MySQL 基线（sql/init_schema_and_data.sql）+ MVP-08 增量
    await addColumnIfMissing('orders', 'order_type', "order_type VARCHAR(32) NOT NULL DEFAULT 'B2C'")
    await addColumnIfMissing('orders', 'customer_name', "customer_name VARCHAR(64) NOT NULL DEFAULT ''")
    await addColumnIfMissing('orders', 'customer_company', 'customer_company VARCHAR(128) DEFAULT NULL')
    await addColumnIfMissing('orders', 'customer_phone', "customer_phone VARCHAR(32) NOT NULL DEFAULT ''")
    await addColumnIfMissing('orders', 'customer_address', "customer_address VARCHAR(255) NOT NULL DEFAULT ''")
    await addColumnIfMissing('orders', 'tracking_no', 'tracking_no VARCHAR(64) DEFAULT NULL')
    await addColumnIfMissing('orders', 'company_id', 'company_id BIGINT DEFAULT NULL')
    await addColumnIfMissing('orders', 'po_number', 'po_number VARCHAR(64) DEFAULT NULL')
    await addColumnIfMissing('orders', 'requested_delivery_date', 'requested_delivery_date DATE DEFAULT NULL')
    await addColumnIfMissing('orders', 'notes', 'notes VARCHAR(1000) DEFAULT NULL')
    await execSql('CREATE INDEX IF NOT EXISTS idx_orders_company_created ON orders (company_id, created_at)')

    // 订单明细对齐 MySQL 基线（sku / unit_price）
    await addColumnIfMissing('order_item', 'sku', "sku VARCHAR(64) NOT NULL DEFAULT ''")
    await addColumnIfMissing('order_item', 'unit_price', 'unit_price DECIMAL(10,2) NOT NULL DEFAULT 0')

    // 2. 检查并写入种子数据
    const categoryCount = await getRows('SELECT COUNT(*) as count FROM product_category')
    if (!categoryCount[0] || categoryCount[0].count === 0) {
      console.log('[wemove-sqlite] Seeding initial data...')

      // 分类
      await runQuery(`INSERT INTO product_category (id, name, slug, description, sort_order) VALUES
        (1, '益智玩具', 'workshop', '动手创造，在木工中学习工程思维与创意设计', 1),
        (2, '家具定制', 'furniture', '天然原木全屋定制，大师设计传承榫卯', 2),
        (3, '中试打样', 'woodlab', '高校与机构研发打样，感受自然材料温度', 3),
        (4, 'STEM教育', 'stem', '科学工程数学实践，玩中培养综合素养', 4),
        (5, '创意套件', 'kits', '精选主题玩具套件，一站式亲子创造体验', 5)
      `)

      // 商品
      await runQuery(`INSERT INTO product (id, sku, name, slug, category_id, price, dealer_price, moq, age_range, material, scene, summary, description, images_json, specs_json, is_published, is_featured, tag) VALUES
        (101, 'WM-BWL-01', '儿童实木保龄球套装 (Mini Bowling Set)', 'kids-bowling-set', 1, 198.00, 118.00, 10, '3-10岁', '天然优质实木 / 水性环保漆', '室内亲子 / 幼儿园活动 / 运动协调', 'WEMOVE SPORTS 经典运动玩具，含10个木质球瓶与2个保龄球，锻炼儿童手眼协调。', '高品质实木打磨，边缘光滑无毛刺，配置便携网袋，适合家庭与幼教机构。', '["/images/prod_20_1.jpg", "/images/prod_14_1.jpg"]', '{"dimensions":"球瓶 18cm x 5.5cm, 球体 直径 7.5cm","netWeight":"1.45 kg","casePack":12}', 1, 1, '热销爆款'),
        (102, 'WM-BLC-02', '极简弧形摇摆平衡板 (Wobble Balance Board)', 'wooden-balance-board', 1, 268.00, 160.00, 6, '3岁及以上 (承重120kg)', '高强度多层天然桦木', '体能感统训练 / 瑜伽拉伸 / 创意开放式玩法', '多功能开放式运动玩具，可作平衡板、摇摆椅、小滑梯或阅读拱桥。', '一体热压成形，表面手工打磨，承重达120kg，大人儿童皆可一同互动。', '["/images/prod_19_1.jpg", "/images/prod_19_2.jpg"]', '{"dimensions":"83cm x 30cm x 1.8cm","netWeight":"3.1 kg","casePack":6}', 1, 1, '新品推荐'),
        (20, 'WM-BLK-50', '50块标准款实木积木套装', '50-wooden-blocks', 1, 198.00, 128.00, 12, '3-8岁', '德国AA级天然榉木', '空间建构 / 建筑启蒙 / 精细动作', '德国AA级榉木精选，经典标准几何结构。', '选用天然榉木精制，质感温润细腻，涵盖立方体、圆柱、三角等几何体。', '["/images/prod_20_1.jpg"]', '{"dimensions":"4cm x 4cm x 4cm","netWeight":"2.1 kg","casePack":8}', 1, 1, '经典常青'),
        (14, 'WM-CUG-01', 'Cugolino Basic 滚珠轨道启智套件', 'cugolino-basic', 1, 328.00, 210.00, 8, '4-10岁', '实木榉木 + 彩色环保漆', '重力势能探索 / 轨道拼装', '入门级滚珠轨道搭建系统，直观感受重力加速度与空间拓扑。', '精巧的凹槽与孔道设计，配合彩色积木块，支持成百上千种轨道设计。', '["/images/prod_14_1.jpg", "/images/prod_14_2.jpg"]', '{"dimensions":"5cm基准","netWeight":"2.8 kg","casePack":6}', 1, 1, '高好评'),
        (15, 'WM-PND-01', '大摆锤重力动力套件', 'pendulum-set', 1, 288.00, 185.00, 10, '5-12岁', '实木机械部件 + 黄铜轴承', '物理机械实验 / 动量守恒', '将物理机械传动融入木玩，展示钟摆摆动与动能传递的迷人规律。', '精密打磨木制连杆配合高精度微型轴承，轻推即可长时间平稳摆动。', '["/images/prod_15_1.jpg", "/images/prod_15_2.jpg"]', '{"dimensions":"26cm x 15cm x 32cm","netWeight":"1.6 kg","casePack":10}', 1, 0, '进阶STEM'),
        (16, 'WM-TRN-01', '小转盘机械传动套', 'turntable-set', 1, 168.00, 105.00, 15, '3-8岁', '纯天然榉木', '齿轮啮合 / 旋转机械', '适合低龄儿童的齿轮与转盘互动探索套件，手摇感受机械连动。', '大齿距实木齿轮，操作手感顺滑阻尼适中。', '["/images/prod_16_1.jpg", "/images/prod_16_2.jpg"]', '{"dimensions":"22cm x 22cm x 8cm","netWeight":"0.95 kg"}', 1, 0, '精细操作'),
        (17, 'WM-LIFT-01', '垂直升降梯木制模型', 'elevator-model', 1, 248.00, 158.00, 10, '5-12岁', '实木 + 尼龙绳缆', '滑轮组省力机械 / 建筑联动', '经典滑轮升降机械结构，可与轨道套件无缝对接形成完整回环。', '通过手摇棘轮机构带动升降轿厢垂直运动。', '["/images/prod_17_1.jpg", "/images/prod_17_2.jpg"]', '{"dimensions":"18cm x 14cm x 40cm","netWeight":"1.3 kg"}', 1, 0, '场景拓展'),
        (18, 'WM-MAG-01', '磁吸弹射轨道套件', 'magnetic-cannon', 1, 268.00, 172.00, 10, '6-14岁', '实木 + 强磁钕铁硼', '高斯加速原理 / 磁力发射', '结合强力磁铁与钢珠动量，展示令人惊叹的高斯磁力直线加速。', '充满趣味与科学震撼力的经典物理木玩。', '["/images/prod_18_1.jpg", "/images/prod_18_2.jpg"]', '{"dimensions":"25cm x 6cm x 5cm","netWeight":"0.8 kg"}', 1, 0, '高科技木玩'),
        (19, 'WM-SNK-01', '蛇形仿生波浪轨道套装', 'snake-track-set', 1, 358.00, 228.00, 6, '4-12岁', '精制弹性实木曲条', '正弦波曲面 / 重力滑行', '优美起伏的连续正弦波木轨，提供极度治愈平稳的滚珠滑行视觉体验。', '高频弯曲成型工艺制作的波浪式轨道。', '["/images/prod_19_1.jpg", "/images/prod_19_2.jpg"]', '{"dimensions":"68cm x 15cm x 18cm","netWeight":"2.2 kg"}', 1, 0, '艺术级美物'),
        (110, 'WM-FUR-T01', '榫卯实木儿童学习桌椅套装', 'kids-study-desk-set', 2, 1680.00, 990.00, 4, '3-12岁', '北美进口白蜡木 / 水性环保漆', '家庭书房 / 儿童房定制 / 幼儿园活动室', '全榫卯结构学习桌椅套装，桌面高度与倾角可随孩子成长调节。', '整套装采用传统榫卯工艺连接，不用一颗螺丝。', '["/images/furniture_s0_f9590908-a1a.png", "/images/furniture_s1_17993665-0ba.png"]', '{"dimensions":"桌 110cm x 60cm x 52-76cm 可调"}', 1, 1, '新品推荐')
      `)

      // 站点配置
      await runQuery(`INSERT INTO site_config (config_key, config_value) VALUES
        ('siteName', 'WEMOVE 惟木匠心'),
        ('logoUrl', ''),
        ('contactPhone', '400-888-9999'),
        ('contactEmail', 'contact@wemovetoy.com'),
        ('address', '上海市浦东新区张江高科园区'),
        ('footerText', '© 2026 WEMOVE 惟木匠心 · 版权所有'),
        ('icpNo', '沪ICP备20260001号-1')
      `)

      // Banner
      await runQuery(`INSERT INTO banner (id, title, image_url, link_url, sort_order, is_active) VALUES
        (1, '儿童实木保龄球套装', '/images/prod_20_1.jpg', '/products', 10, 1),
        (2, '极简弧形摇摆平衡板', '/images/prod_19_1.jpg', '/products', 20, 1)
      `)

      // 演示账号（公开密码）仅允许写入本地开发库，生产环境由 db-config 保证不会走到这里
      if (seedDemoData) {
        await runQuery(`INSERT INTO sys_user (id, username, password_hash, real_name, email, phone, role, company_id, status) VALUES
          (1, 'admin', '$2a$10$uKF34.jKH7gQvk.oa7tWWu9jHQgH7UarEFSazq/S/UUJb9FC5JEyi', '系统管理员', 'admin@wemovetoy.com', '13800000001', 'ADMIN', NULL, 1),
          (2, 'demo_user', '$2a$10$uKF34.jKH7gQvk.oa7tWWu9jHQgH7UarEFSazq/S/UUJb9FC5JEyi', '演示用户', 'demo_user@wemovetoy.com', '13800000002', 'USER', NULL, 1),
          (3, 'dealer_demo', '$2a$10$uKF34.jKH7gQvk.oa7tWWu9jHQgH7UarEFSazq/S/UUJb9FC5JEyi', '李经理', 'dealer@starwood.com', '13812345678', 'DEALER', 1, 1)
        `)

        await runQuery(`INSERT INTO dealer_company (id, company_name, tax_id, business_type, region, tier_name, discount_rate, contact_name, contact_phone, contact_email, status) VALUES
          (1, '上海晨星益智玩具有限公司', '91310115MA1KXXXX01', '线下母婴及连锁玩具店', '华东大区 (上海/江苏/浙江)', '一级核心经销商', 0.65, '李经理', '13812345678', 'dealer@starwood.com', 'ACTIVE')
        `)
      } else {
        console.log('[wemove-sqlite] demo accounts skipped (seedDemoData=false)')
      }

      // 文章分类
      await runQuery(`INSERT INTO article_category (id, name, slug, sort_order) VALUES
        (1, '公司动态', 'company-news', 1),
        (2, '行业资讯', 'industry-news', 2),
        (3, '活动回顾', 'event-review', 3)
      `)

      // 动态文章
      await runQuery(`INSERT INTO article (id, title, slug, category_id, cover_image, summary, content, status, published_at) VALUES
        (1, '匠心筑梦工作室正式启航', 'jiangxin-studio-launch', 1, '/images/dream_s0_8cbf0a99-297.png', '匠心筑梦工作室于今日正式对外开放，致力于为青少年提供优质的STEM教育体验与实木手作工坊。', '今日，匠心筑梦工作室正式对外开放。工作室融合德国实木工艺理念与现代创新设计，设立专属青少年创客空间与亲子体验区。', 'PUBLISHED', '2026-08-01 10:00:00'),
        (2, '2026年度玩教具课程全面升级公告', '2026-course-upgrade', 1, '/images/stem_s0_3eea7200-6ed.jpg', 'WeMove 全面升级了2026年度实木教具与STEAM课程体系，新增多个结构力学与电子感应实践项目模块。', '为进一步推动实木STEAM跨学科教育，我们对核心课程体系进行了全方位升级。', 'PUBLISHED', '2026-08-15 09:30:00'),
        (3, '木玩教育行业趋势：自然环保与跨学科融合', 'stem-industry-trends-2026', 2, '/images/woodlab_s0_6337d9b4-4fa.png', '2026年全球木玩与早教装备行业呈现出绿色低碳化、数字化融合与自主探究化三大鲜明趋势。', '随着绿色环保与可持续发展理念深入人心，天然原木材质因其亲和温润的质感成为高端教育装备的首选。', 'PUBLISHED', '2026-08-20 14:00:00')
      `)

      // 常见问题
      await runQuery(`INSERT INTO faq (id, question, answer, category, sort_order, status) VALUES
        (1, '如何查看产品资料？', '在下载中心可以查看公开的电子说明书和产品资料。', '购买', 1, 'PUBLISHED'),
        (2, '如何申请成为经销商？', '登录后打开“成为经销商”，提交企业资料，审核通过后即可查看经销商门户。', '合作', 2, 'PUBLISHED'),
        (3, '提交留言后多久会处理？', '工作日通常会在一个工作日内处理，请保留留言编号以便查询。', '售后', 3, 'PUBLISHED')
      `)

      // 电子说明书与下载资源
      await runQuery(`INSERT INTO download_resource (id, title, category, description, file_url, cover_image, visibility, sort_order, status) VALUES
        (1, 'WeMove 电子说明书示例', 'manual', '公开电子说明书资源示例。', '/images/electronic_grid0_0_1c281559-002.png', '/images/electronic_grid0_0_1c281559-002.png', 'PUBLIC', 1, 'PUBLISHED'),
        (2, '会员资料包', 'catalog', '登录后可访问。', '/images/electronic_grid1_0_c4ebc66c-1c4.png', '/images/electronic_grid1_0_c4ebc66c-1c4.png', 'USER', 2, 'PUBLISHED'),
        (3, '经销商资料包', 'dealer', '登录并通过经销商审核后可访问。', '/images/electronic_grid2_0_635fbdee-fe3.png', '/images/electronic_grid2_0_635fbdee-fe3.png', 'DEALER', 3, 'PUBLISHED')
      `)

      console.log('[wemove-sqlite] Seeding completed successfully!')
    }

    // 确保 download_resource 独立写入（兼容已存在数据库）
    const downloadCount = await getRows('SELECT COUNT(*) as count FROM download_resource')
    if (!downloadCount[0] || downloadCount[0].count === 0) {
      await runQuery(`INSERT INTO download_resource (id, title, category, description, file_url, cover_image, visibility, sort_order, status) VALUES
        (1, 'WeMove 电子说明书示例', 'manual', '公开电子说明书资源示例。', '/images/electronic_grid0_0_1c281559-002.png', '/images/electronic_grid0_0_1c281559-002.png', 'PUBLIC', 1, 'PUBLISHED'),
        (2, '会员资料包', 'catalog', '登录后可访问。', '/images/electronic_grid1_0_c4ebc66c-1c4.png', '/images/electronic_grid1_0_c4ebc66c-1c4.png', 'USER', 2, 'PUBLISHED'),
        (3, '经销商资料包', 'dealer', '登录并通过经销商审核后可访问。', '/images/electronic_grid2_0_635fbdee-fe3.png', '/images/electronic_grid2_0_635fbdee-fe3.png', 'DEALER', 3, 'PUBLISHED')
      `)
    }

    // 确保 faq 独立写入（兼容已存在数据库）
    const faqCount = await getRows('SELECT COUNT(*) as count FROM faq')
    if (!faqCount[0] || faqCount[0].count === 0) {
      await runQuery(`INSERT INTO faq (id, question, answer, category, sort_order, status) VALUES
        (1, '如何查看产品资料？', '在下载中心可以查看公开的电子说明书和产品资料。', '购买', 1, 'PUBLISHED'),
        (2, '如何申请成为经销商？', '登录后打开“成为经销商”，提交企业资料，审核通过后即可查看经销商门户。', '合作', 2, 'PUBLISHED'),
        (3, '提交留言后多久会处理？', '工作日通常会在一个工作日内处理，请保留留言编号以便查询。', '售后', 3, 'PUBLISHED')
      `)
    }

    // 确保 page 栏目单页数据写入（家具、木玩打样、STEM、科研、公益、筑梦、电子说明书）
    const pageCount = await getRows('SELECT COUNT(*) as count FROM page')
    if (!pageCount[0] || pageCount[0].count === 0) {
      console.log('[wemove-sqlite] Seeding page content...')
      let pageData: Record<string, any> = {}
      const possibleJsonPaths = [
        path.resolve(__dirname, '../../../frontend/src/data/pageSections.json'),
        path.resolve(__dirname, '../../frontend/src/data/pageSections.json'),
        path.resolve(process.cwd(), '../frontend/src/data/pageSections.json'),
        path.resolve(process.cwd(), 'frontend/src/data/pageSections.json')
      ]
      for (const p of possibleJsonPaths) {
        if (fs.existsSync(p)) {
          try {
            pageData = JSON.parse(fs.readFileSync(p, 'utf8'))
            break
          } catch {}
        }
      }

      const PAGE_META: Record<string, { id: number; title: string }> = {
        furniture: { id: 1, title: '原木家具' },
        woodlab: { id: 2, title: '中试打样' },
        stem: { id: 3, title: 'STEM教育' },
        library: { id: 4, title: '科研研发' },
        charity: { id: 5, title: '公益项目' },
        dream: { id: 6, title: '匠心筑梦' },
        electronic: { id: 7, title: '电子制作' }
      }

      for (const [slug, meta] of Object.entries(PAGE_META)) {
        const sections = pageData[slug] || []
        const sectionsJson = JSON.stringify(sections)
        await runQuery(
          `INSERT INTO page (id, slug, title, sections_json, status) VALUES (?, ?, ?, ?, 'PUBLISHED')`,
          [meta.id, slug, meta.title, sectionsJson]
        )
      }
      console.log('[wemove-sqlite] Page content seeded successfully!')
    }
  } finally {
    db.close()
  }
}

