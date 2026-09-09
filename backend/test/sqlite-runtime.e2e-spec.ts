import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Response } from 'superagent'
import { DataSource } from 'typeorm'
import { existsSync, mkdtempSync, rmSync } from 'fs'
import { tmpdir } from 'os'
import { join } from 'path'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app-setup'
import { ensureSqliteDatabase } from '../src/database/sqlite-init'

/**
 * SQLite 运行路径端到端用例。
 *
 * 之前的 e2e 只覆盖 MySQL，SQLite 建表语句与实体/MySQL 基线不同步的问题（评审 P1）因此漏网。
 * 这里真正用 DB_TYPE=sqlite 启动整个应用，覆盖此前稳定 500 的接口：
 * - GET  /dealer/applications/mine      （dealer_application.user_id）
 * - GET  /dealer/portal/me              （dealer_application.user_id）
 * - POST /auth/password-reset/request   （password_reset_token.token_hash）
 * - GET  /dealer/workspace/summary|orders（orders.tracking_no 等 B2B 字段）
 * - 管理员报价回复与订单状态机（SQLite 不支持 FOR UPDATE）
 */
describe('SQLite runtime (e2e)', () => {
  let app: INestApplication
  let dbFile: string
  const savedEnv: Record<string, string | undefined> = {}

  const setEnv = (key: string, value: string | undefined) => {
    savedEnv[key] = process.env[key]
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }

  beforeAll(async () => {
    // 必须在编译 AppModule 之前切换到 SQLite，并清掉其他 e2e 注入的 MySQL 变量
    setEnv('NODE_ENV', 'test')
    setEnv('DB_TYPE', 'sqlite')
    setEnv('DB_HOST', undefined)
    setEnv('DB_PORT', undefined)
    setEnv('DB_USER', undefined)
    setEnv('DB_PASSWORD', undefined)
    setEnv('DB_USERNAME', undefined)
    dbFile = join(mkdtempSync(join(tmpdir(), 'wemove-sqlite-')), 'wemove.sqlite')
    setEnv('DB_DATABASE', dbFile)

    await ensureSqliteDatabase(dbFile, { seedDemoData: true })
    expect(existsSync(dbFile)).toBe(true)

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    configureApp(app)
    await app.init()
    const dataSource = app.get(DataSource)
    if (!dataSource.isInitialized) await dataSource.initialize()
    expect(dataSource.options.type).toBe('sqlite')
  }, 60000)

  afterAll(async () => {
    if (app) await app.close()
    for (const [key, value] of Object.entries(savedEnv)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    if (dbFile) rmSync(dbFile, { force: true })
  })

  function cookies(res: { headers: Record<string, unknown> }): string {
    const values = (res.headers['set-cookie'] as string[] | undefined) ?? []
    return values.map((value) => value.split(';')[0]).join('; ')
  }

  async function loginAs(identifier: string) {
    const plain = request(app.getHttpServer())
    const csrf = await plain.get('/api/v1/auth/csrf').expect(200)
    const session = await plain
      .post('/api/v1/auth/login')
      .set('Cookie', cookies(csrf))
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ identifier, password: 'Wemove@123' })
      .expect(200)

    const sessionCookie = cookies(session)
    const write = async (method: 'post' | 'patch' | 'put', path: string, body?: object): Promise<Response> => {
      const fresh = await plain.get('/api/v1/auth/csrf').expect(200)
      return plain[method](path)
        .set('Cookie', `${sessionCookie}; ${cookies(fresh)}`)
        .set('X-CSRF-Token', fresh.body.data.csrfToken)
        .send(body ?? {})
    }

    return {
      get: (path: string) => plain.get(path).set('Cookie', sessionCookie),
      post: (path: string, body?: object) => write('post', path, body),
      patch: (path: string, body?: object) => write('patch', path, body),
      put: (path: string, body?: object) => write('put', path, body)
    }
  }

  it('SQLite 演示库可以直接登录并读取健康检查和目录', async () => {
    const server = app.getHttpServer()
    await request(server).get('/api/v1/health').expect(200)
    const categories = await request(server).get('/api/v1/categories')
    expect(categories.status).toBe(200)
    expect(categories.body.data.length).toBeGreaterThan(0)

    const user = await loginAs('demo_user')
    const me = await user.get('/api/v1/auth/me')
    expect(me.status).toBe(200)
    expect(me.body.data).toMatchObject({ username: 'demo_user', role: 'USER' })
  })

  it('经销商申请可以绑定用户并回读（dealer_application.user_id）', async () => {
    const user = await loginAs('demo_user')
    const created = await user.post('/api/v1/dealer/applications', {
      companyName: 'SQLite 验收企业',
      taxId: 'SQLITE-TAX-0001',
      businessType: '教育机构采购',
      region: '华东',
      contactName: '验收用户',
      phone: '13800002222',
      email: 'sqlite-dealer@example.com',
      annualTarget: '50-100万',
      salesChannels: 'sqlite e2e'
    })
    expect(created.status).toBe(201)

    const mine = await user.get('/api/v1/dealer/applications/mine')
    expect(mine.status).toBe(200)
    expect(mine.body.data).toHaveLength(1)
    expect(mine.body.data[0]).toMatchObject({ companyName: 'SQLite 验收企业', status: 'PENDING' })
    expect(mine.body.data[0].userId).toBe(created.body.data.userId)
  })

  it('经销商门户回读企业与申请记录（dealer_application.user_id）', async () => {
    const dealer = await loginAs('dealer_demo')
    const portal = await dealer.get('/api/v1/dealer/portal/me')
    expect(portal.status).toBe(200)
    expect(portal.body.data.company).toMatchObject({ id: '1' })
    expect(Array.isArray(portal.body.data.applications)).toBe(true)
  })

  it('找回密码使用 token_hash 落库（password_reset_token.token_hash）', async () => {
    const plain = request(app.getHttpServer())
    const csrf = await plain.get('/api/v1/auth/csrf').expect(200)
    const res = await plain
      .post('/api/v1/auth/password-reset/request')
      .set('Cookie', cookies(csrf))
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send({ email: 'demo_user@wemovetoy.com' })
    expect(res.status).toBe(200)

    const db = app.get(DataSource)
    const rows = await db.query('SELECT id, token_hash FROM password_reset_token WHERE user_id = 2')
    expect(rows.length).toBeGreaterThan(0)
    expect(String(rows[0].token_hash).length).toBeGreaterThan(0)
  })

  it('工作台摘要与订单列表可用（orders B2B 字段）', async () => {
    const dealer = await loginAs('dealer_demo')
    const summary = await dealer.get('/api/v1/dealer/workspace/summary')
    expect(summary.status).toBe(200)
    expect(summary.body.data.stats).toMatchObject({ authorizedProducts: expect.any(Number) })

    const orders = await dealer.get('/api/v1/dealer/workspace/orders?page=1&pageSize=10')
    expect(orders.status).toBe(200)
    expect(Array.isArray(orders.body.data.items)).toBe(true)
  })

  it('经销商下单写入完整 B2B 字段，管理员可回复报价并推进订单状态机', async () => {
    const dealer = await loginAs('dealer_demo')
    const address = await dealer.post('/api/v1/dealer/workspace/addresses', {
      label: '总部仓库',
      recipientName: '李经理',
      phone: '13812345678',
      province: '上海市',
      city: '上海市',
      district: '浦东新区',
      detailAddress: ' SQLite 验收地址 1 号',
      addressType: 'SHIPPING',
      isDefault: true
    })
    expect(address.status).toBe(201)

    const order = await dealer.post('/api/v1/dealer/workspace/orders', {
      addressId: Number(address.body.data.id),
      paymentMethod: 'PURCHASE_ORDER',
      poNumber: 'SQLITE-PO-001',
      requestedDeliveryDate: '2026-12-01',
      notes: 'sqlite e2e',
      items: [{ productId: 101, quantity: 10 }]
    })
    expect(order.status).toBe(201)
    expect(order.body.data).toMatchObject({ status: 'PENDING_REVIEW', totalAmount: 1180 })

    const db = app.get(DataSource)
    const stored = await db.query(
      `SELECT o.order_type, o.customer_name, o.customer_company, o.customer_phone, o.customer_address,
              o.tracking_no, oi.sku, oi.unit_price
       FROM orders o JOIN order_item oi ON oi.order_id = o.id WHERE o.id = ?`,
      [order.body.data.orderNo]
    )
    expect(stored[0]).toMatchObject({ order_type: 'B2B', sku: 'WM-BWL-01' })
    expect(Number(stored[0].unit_price)).toBe(118)

    const admin = await loginAs('admin')
    const quote = await dealer.post('/api/v1/dealer/workspace/quotes', {
      requestedDeliveryDate: '2026-12-15',
      notes: 'sqlite e2e 询价',
      items: [{ productId: 102, quantity: 12 }]
    })
    expect(quote.status).toBe(201)

    const decision = await admin.patch(`/api/v1/admin/dealer/quotes/${quote.body.data.quoteNo}/decision`, {
      action: 'QUOTED',
      totalAmountFen: 129900,
      validUntil: '2026-12-20',
      platformNote: 'sqlite e2e 报价'
    })
    expect(decision.status).toBe(200)
    expect(decision.body.data).toMatchObject({ status: 'QUOTED', totalAmount: 1299 })

    const orderNo = order.body.data.orderNo
    await admin.patch(`/api/v1/admin/dealer/orders/${orderNo}/status`, { status: 'CONFIRMED' })
      .then((res) => expect(res.status).toBe(200))
    await admin.patch(`/api/v1/admin/dealer/orders/${orderNo}/status`, { status: 'SHIPPED', trackingNo: 'SF-SQLITE-001' })
      .then((res) => expect(res.status).toBe(200))

    const tracked = await db.query('SELECT tracking_no FROM orders WHERE id = ?', [orderNo])
    expect(tracked[0].tracking_no).toBe('SF-SQLITE-001')
  })
})
