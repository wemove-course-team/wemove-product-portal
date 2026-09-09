import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Response } from 'superagent'
import { DataSource } from 'typeorm'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app-setup'
import { setupTestDatabase } from './setup-db'

process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1'
process.env.DB_PORT = process.env.DB_PORT || '3306'
process.env.DB_USER = process.env.DB_USER || 'root'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'wemove123'
process.env.DB_NAME = process.env.E2E_DB_NAME || 'wemove_portal_test'

function cookies(res: { headers: Record<string, unknown> }): string {
  const values = (res.headers['set-cookie'] as string[] | undefined) ?? []
  return values.map((value) => value.split(';')[0]).join('; ')
}

interface Client {
  sessionCookie: string
  get(path: string): Promise<Response>
  post(path: string, body?: object): Promise<Response>
  patch(path: string, body?: object): Promise<Response>
  put(path: string, body?: object): Promise<Response>
}

async function loginAs(app: INestApplication, identifier: string): Promise<Client> {
  const plain = request(app.getHttpServer())
  const csrf = await plain.get('/api/v1/auth/csrf').expect(200)
  const session = await plain
    .post('/api/v1/auth/login')
    .set('Cookie', cookies(csrf))
    .set('X-CSRF-Token', csrf.body.data.csrfToken)
    .send({ identifier, password: 'Wemove@123' })
    .expect(200)

  const sessionCookie = cookies(session)

  return clientWithSession(app, sessionCookie)
}

function clientWithSession(app: INestApplication, sessionCookie: string): Client {
  const plain = request(app.getHttpServer())

  async function write(method: 'post' | 'patch' | 'put', path: string, body?: object) {
    const fresh = await plain.get('/api/v1/auth/csrf').expect(200)
    return plain[method](path)
      .set('Cookie', `${sessionCookie}; ${cookies(fresh)}`)
      .set('X-CSRF-Token', fresh.body.data.csrfToken)
      .send(body ?? {})
  }

  return {
    sessionCookie,
    get: (path) => plain.get(path).set('Cookie', sessionCookie),
    post: (path, body) => write('post', path, body),
    patch: (path, body) => write('patch', path, body),
    put: (path, body) => write('put', path, body)
  }
}

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication()
  configureApp(app)
  await app.init()
  const dataSource = app.get(DataSource)
  if (!dataSource.isInitialized) await dataSource.initialize()
  return app
}

const applicationInput = {
  companyName: '自动化验收经销商企业',
  taxId: 'E2E-DEALER-20260907',
  businessType: '教育机构采购',
  region: '华东',
  contactName: '验收用户',
  phone: '13800009999',
  email: 'e2e-dealer@example.com',
  annualTarget: '50-100万',
  salesChannels: 'e2e 自动化测试渠道'
}

describe('Dealer API (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    await setupTestDatabase()
    app = await createApp()
  }, 120000)

  afterAll(async () => {
    if (app) await app.close()
  })

  it('登录后可以读取 /auth/me', async () => {
    const user = await loginAs(app, 'demo_user')
    const res = await user.get('/api/v1/auth/me')

    expect(res.status).toBe(200)
    expect(res.body.data).toMatchObject({ username: 'demo_user', role: 'USER' })
  })

  it('游客访问申请和门户接口返回 401', async () => {
    const server = app.getHttpServer()
    const csrf = await request(server).get('/api/v1/auth/csrf').expect(200)
    const submit = await request(server)
      .post('/api/v1/dealer/applications')
      .set('Cookie', cookies(csrf))
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send(applicationInput)
    const mine = await request(server).get('/api/v1/dealer/applications/mine')
    const portal = await request(server).get('/api/v1/dealer/portal/me')

    expect(submit.status).toBe(401)
    expect(mine.status).toBe(401)
    expect(portal.status).toBe(401)
    expect(submit.body.code).toBe('AUTH_401')
  })

  it('普通用户访问管理员审核接口返回 403', async () => {
    const user = await loginAs(app, 'demo_user')
    const res = await user.get('/api/v1/admin/dealer/applications')

    expect(res.status).toBe(403)
    expect(res.body.code).toBe('FORBIDDEN_403')
  })

  it('写请求缺少 CSRF 时被拒绝', async () => {
    const admin = await loginAs(app, 'admin')
    const res = await request(app.getHttpServer())
      .post('/api/v1/dealer/applications')
      .set('Cookie', admin.sessionCookie)
      .send(applicationInput)

    expect(res.status).toBe(403)
    expect(res.body.code).toBe('FORBIDDEN_403')
  })

  it('申请只能绑定当前用户，重复申请返回 409', async () => {
    const user = await loginAs(app, 'demo_user')
    const results = await Promise.all([
      user.post('/api/v1/dealer/applications', applicationInput),
      user.post('/api/v1/dealer/applications', { ...applicationInput, companyName: '重复申请' })
    ])
    const [first, second] = results.sort((a, b) => a.status - b.status)
    const mine = await user.get('/api/v1/dealer/applications/mine')

    expect(first.status).toBe(201)
    expect(first.body.data).toMatchObject({ userId: expect.any(String), status: 'PENDING' })
    expect(second.status).toBe(409)
    expect(second.body.code).toBe('CONFLICT_409')
    expect(mine.body.data).toHaveLength(1)
    expect(mine.body.data[0].userId).toBe(first.body.data.userId)
  })

  it('管理员审核通过后升级角色并持久化，旧会话重启后仍有效', async () => {
    const user = await loginAs(app, 'demo_user')
    const admin = await loginAs(app, 'admin')
    const mine = await user.get('/api/v1/dealer/applications/mine')
    const applicationId = mine.body.data[0].id

    const review = await admin.patch(`/api/v1/admin/dealer/applications/${applicationId}/review`, {
      action: 'APPROVED',
      tierName: '一级经销商',
      discountRate: 0.65,
      auditNote: '自动化验收通过'
    })
    expect(review.status).toBe(200)
    expect(review.body.data).toMatchObject({ id: applicationId, status: 'APPROVED', auditNote: '自动化验收通过' })

    const meAfterReview = await user.get('/api/v1/auth/me')
    expect(meAfterReview.status).toBe(200)
    expect(meAfterReview.body.data).toMatchObject({ role: 'DEALER' })

    const dealerProduct = await user.get('/api/v1/products/kids-study-desk-set')
    expect(dealerProduct.status).toBe(200)
    expect(dealerProduct.body.data).toMatchObject({ dealerPrice: expect.any(Number), moq: expect.any(Number) })

    const db = app.get(DataSource)
    const rows = await db.query(
      'SELECT status, audit_note, tier_name, discount_rate FROM dealer_application WHERE id = ?',
      [applicationId]
    )
    expect(rows[0]).toMatchObject({ status: 'APPROVED', audit_note: '自动化验收通过', tier_name: '一级经销商' })

    await app.close()
    app = await createApp()
    const persistedUser = await clientWithSession(app, user.sessionCookie).get('/api/v1/dealer/portal/me')
    expect(persistedUser.status).toBe(200)
    expect(persistedUser.body.data.applications[0]).toMatchObject({ id: applicationId, status: 'APPROVED' })
    expect(persistedUser.body.data.company).toMatchObject({ tierName: '一级经销商', discountRate: 0.65 })
  })

  it('重复审核已处理申请返回 409', async () => {
    const admin = await loginAs(app, 'admin')
    const applications = await admin.get('/api/v1/admin/dealer/applications?status=APPROVED')
    const applicationId = applications.body.data.items[0].id
    const res = await admin.patch(`/api/v1/admin/dealer/applications/${applicationId}/review`, {
      action: 'REJECTED',
      auditNote: '不应重复审核'
    })

    expect(res.status).toBe(409)
    expect(res.body.code).toBe('CONFLICT_409')
  })

  it('经销商工作台按企业返回真实摘要与授权价格', async () => {
    const dealer = await loginAs(app, 'dealer_demo')
    const [summary, catalog, company] = await Promise.all([
      dealer.get('/api/v1/dealer/workspace/summary'),
      dealer.get('/api/v1/dealer/workspace/catalog?page=1&pageSize=5'),
      dealer.get('/api/v1/dealer/workspace/company')
    ])

    expect(summary.status).toBe(200)
    expect(summary.body.data).toMatchObject({
      company: { id: '1', companyName: '上海晨星益智玩具有限公司' },
      memberRole: 'OWNER',
      stats: { authorizedProducts: expect.any(Number), pendingQuotes: expect.any(Number), activeOrders: expect.any(Number) }
    })
    expect(catalog.status).toBe(200)
    expect(catalog.body.data.items[0]).toMatchObject({ dealerPrice: expect.any(Number), moq: expect.any(Number) })
    expect(company.body.data.addresses.length).toBeGreaterThan(0)
    expect(company.body.data.members.some((item: { username: string }) => item.username === 'dealer_demo')).toBe(true)
  })

  it('普通用户和管理员不能冒充经销商访问企业工作台', async () => {
    const user = await loginAs(app, 'admin')
    const response = await user.get('/api/v1/dealer/workspace/summary')
    expect(response.status).toBe(403)
    expect(response.body.code).toBe('FORBIDDEN_403')
  })

  it('快捷下单强制校验 MOQ，合法订单保存价格快照与企业边界', async () => {
    const dealer = await loginAs(app, 'dealer_demo')
    const company = await dealer.get('/api/v1/dealer/workspace/company')
    expect(company.status).toBe(200)
    const addressId = Number(company.body.data.addresses[0].id)

    const belowMoq = await dealer.post('/api/v1/dealer/workspace/orders', {
      addressId,
      paymentMethod: 'BANK_TRANSFER',
      requestedDeliveryDate: '2026-10-01',
      items: [{ productId: 101, quantity: 1 }]
    })
    expect(belowMoq.status).toBe(409)
    expect(belowMoq.body.message).toContain('起订量')

    const created = await dealer.post('/api/v1/dealer/workspace/orders', {
      addressId,
      paymentMethod: 'PURCHASE_ORDER',
      poNumber: 'E2E-PO-001',
      requestedDeliveryDate: '2026-10-01',
      notes: 'E2E 快捷下单',
      items: [{ productId: 101, quantity: 10 }]
    })
    expect(created.status).toBe(201)
    expect(created.body.data).toMatchObject({ status: 'PENDING_REVIEW', totalAmount: 1180 })

    const db = app.get(DataSource)
    const rows = await db.query(
      `SELECT o.company_id, o.po_number, oi.unit_price, oi.quantity
       FROM orders o JOIN order_item oi ON oi.order_id = o.id WHERE o.id = ?`,
      [created.body.data.orderNo]
    )
    expect(rows[0]).toMatchObject({ company_id: '1', po_number: 'E2E-PO-001', unit_price: '118.00', quantity: 10 })
  })

  it('询价保存商品快照，企业停用后成员立即失去工作台访问', async () => {
    const dealer = await loginAs(app, 'dealer_demo')
    const quote = await dealer.post('/api/v1/dealer/workspace/quotes', {
      requestedDeliveryDate: '2026-10-15',
      notes: 'E2E 报价请求',
      items: [{ productId: 102, quantity: 12 }]
    })
    expect(quote.status).toBe(201)
    expect(quote.body.data.status).toBe('SUBMITTED')

    const db = app.get(DataSource)
    const snapshot = await db.query(
      `SELECT q.company_id, qi.sku_snapshot, qi.product_name_snapshot, qi.quantity
       FROM dealer_quote q JOIN dealer_quote_item qi ON qi.quote_id = q.id WHERE q.quote_no = ?`,
      [quote.body.data.quoteNo]
    )
    expect(snapshot[0]).toMatchObject({ company_id: '1', sku_snapshot: 'WM-BLC-02', product_name_snapshot: '极简弧形摇摆平衡板 (Wobble Balance Board)', quantity: 12 })

    const admin = await loginAs(app, 'admin')
    await admin.patch('/api/v1/admin/dealer/companies/1/status', { status: 'SUSPENDED' }).then((res) => expect(res.status).toBe(200))
    await dealer.get('/api/v1/dealer/workspace/summary').then((res) => expect(res.status).toBe(403))
    await admin.patch('/api/v1/admin/dealer/companies/1/status', { status: 'ACTIVE' }).then((res) => expect(res.status).toBe(200))
  })

  it('管理员只能按状态机回复报价、确认订单并登记物流', async () => {
    const admin = await loginAs(app, 'admin')
    const quotes = await admin.get('/api/v1/admin/dealer/quotes?status=SUBMITTED')
    const quoteNo = quotes.body.data.items[0].quoteNo
    await admin.patch(`/api/v1/admin/dealer/quotes/${quoteNo}/decision`, {
      action: 'QUOTED', platformNote: '缺失正式报价金额和有效期'
    }).then((res) => expect(res.status).toBe(400))
    await admin.patch(`/api/v1/admin/dealer/quotes/${quoteNo}/decision`, {
      action: 'QUOTED', totalAmountFen: 129900, validUntil: '2026-10-20', platformNote: '报价含税，物流费用另计。'
    }).then((res) => {
      expect(res.status).toBe(200)
      expect(res.body.data).toMatchObject({ status: 'QUOTED', totalAmount: 1299 })
    })
    await admin.patch(`/api/v1/admin/dealer/quotes/${quoteNo}/decision`, {
      action: 'REJECTED', platformNote: '不允许重复处理。'
    }).then((res) => expect(res.status).toBe(409))

    const orders = await admin.get('/api/v1/admin/dealer/orders?status=PENDING_REVIEW')
    const orderNo = orders.body.data.items[0].orderNo
    await admin.patch(`/api/v1/admin/dealer/orders/${orderNo}/status`, { status: 'CONFIRMED' }).then((res) => expect(res.status).toBe(200))
    await admin.patch(`/api/v1/admin/dealer/orders/${orderNo}/status`, { status: 'SHIPPED' }).then((res) => expect(res.status).toBe(400))
    await admin.patch(`/api/v1/admin/dealer/orders/${orderNo}/status`, { status: 'SHIPPED', trackingNo: 'SF-E2E-001' }).then((res) => expect(res.status).toBe(200))
    await admin.patch(`/api/v1/admin/dealer/orders/${orderNo}/status`, { status: 'COMPLETED' }).then((res) => expect(res.status).toBe(200))
    await admin.patch(`/api/v1/admin/dealer/orders/${orderNo}/status`, { status: 'CANCELLED' }).then((res) => expect(res.status).toBe(409))
  })

  it('企业普通成员只读，只有 OWNER 可以修改企业资料和新增地址', async () => {
    const dealer = await loginAs(app, 'dealer_demo')
    const db = app.get(DataSource)
    await db.query("UPDATE sys_user SET dealer_member_role = 'MEMBER' WHERE username = 'dealer_demo'")
    const payload = {
      businessType: '线下母婴及连锁玩具店', contactName: '李经理',
      contactPhone: '13812345678', contactEmail: 'dealer@starwood.com'
    }
    try {
      await dealer.put('/api/v1/dealer/workspace/company', payload).then((res) => expect(res.status).toBe(403))
      await dealer.post('/api/v1/dealer/workspace/addresses', {
        label: '越权地址', recipientName: '李经理', phone: '13812345678', province: '上海市',
        city: '上海市', district: '浦东新区', detailAddress: '不应写入数据库', addressType: 'SHIPPING'
      }).then((res) => expect(res.status).toBe(403))
    } finally {
      await db.query("UPDATE sys_user SET dealer_member_role = 'OWNER' WHERE username = 'dealer_demo'")
    }
    await dealer.put('/api/v1/dealer/workspace/company', payload).then((res) => {
      expect(res.status).toBe(200)
      expect(res.body.data.memberRole).toBe('OWNER')
    })
  })
})
