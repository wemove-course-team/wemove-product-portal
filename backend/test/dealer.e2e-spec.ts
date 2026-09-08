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

  async function write(method: 'post' | 'patch', path: string, body?: object) {
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
    patch: (path, body) => write('patch', path, body)
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
})
