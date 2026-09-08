import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Response } from 'superagent'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app-setup'
import { setupTestDatabase } from './setup-db'

process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1'
process.env.DB_PORT = process.env.DB_PORT || '3306'
process.env.DB_USER = process.env.DB_USER || 'root'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'wemove123'
process.env.DB_NAME = process.env.E2E_DB_NAME || 'wemove_portal_test'

function cookies(res: { headers: Record<string, unknown> }) {
  return ((res.headers['set-cookie'] as string[] | undefined) || []).map((value) => value.split(';')[0]).join('; ')
}

async function login(app: INestApplication, identifier: string) {
  const plain = request(app.getHttpServer())
  const csrf = await plain.get('/api/v1/auth/csrf').expect(200)
  const session = await plain.post('/api/v1/auth/login').set('Cookie', cookies(csrf)).set('X-CSRF-Token', csrf.body.data.csrfToken).send({ identifier, password: 'Wemove@123' }).expect(200)
  const sessionCookie = cookies(session)
  async function write(method: 'post' | 'patch' | 'delete', path: string, body?: object) {
    const fresh = await plain.get('/api/v1/auth/csrf').expect(200)
    const requestBuilder = plain[method](path).set('Cookie', `${sessionCookie}; ${cookies(fresh)}`).set('X-CSRF-Token', fresh.body.data.csrfToken)
    return method === 'delete' ? requestBuilder : requestBuilder.send(body || {})
  }
  return {
    get: (path: string) => plain.get(path).set('Cookie', sessionCookie),
    post: (path: string, body: object) => write('post', path, body),
    patch: (path: string, body: object) => write('patch', path, body),
    delete: (path: string) => write('delete', path)
  }
}

describe('Support API (e2e)', () => {
  let app: INestApplication
  beforeAll(async () => {
    await setupTestDatabase()
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    configureApp(app)
    await app.init()
  }, 120000)
  afterAll(async () => { await app?.close() })

  it('游客可以读取已发布 FAQ 和公开下载', async () => {
    const server = request(app.getHttpServer())
    const faq = await server.get('/api/v1/faqs').expect(200)
    const downloads = await server.get('/api/v1/downloads').expect(200)
    expect(faq.body.data.length).toBeGreaterThan(0)
    expect(downloads.body.data.every((item: { visibility: string }) => item.visibility === 'PUBLIC')).toBe(true)
  })

  it('游客携带 CSRF 可以提交留言，缺少 CSRF 会被拒绝', async () => {
    const server = request(app.getHttpServer())
    const csrf = await server.get('/api/v1/auth/csrf').expect(200)
    const input = { name: '游客测试', email: 'guest-e2e@example.com', subject: `游客留言-${Date.now()}`, content: '这是一条带 CSRF 的游客留言。' }
    const created = await server.post('/api/v1/support/messages')
      .set('Cookie', cookies(csrf))
      .set('X-CSRF-Token', csrf.body.data.csrfToken)
      .send(input)
    expect(created.status).toBe(201)

    const rejected = await server.post('/api/v1/support/messages').send({ ...input, subject: `${input.subject}-缺少令牌` })
    expect(rejected.status).toBe(403)
  })

  it('留言会生成编号并拒绝 60 秒内相同主题重复提交', async () => {
    const user = await login(app, 'demo_user')
    const input = { name: '支持测试', email: 'support-e2e@example.com', phone: '13800009999', subject: `测试主题-${Date.now()}`, content: '这是一条用于验收支持中心的留言内容。' }
    const created = await user.post('/api/v1/support/messages', input)
    expect(created.status).toBe(201)
    expect(created.body.data.code).toMatch(/^MSG-\d{8}-\d{4}$/)
    const duplicate = await user.post('/api/v1/support/messages', input)
    expect(duplicate.status).toBe(400)
    expect(duplicate.body.code).toBe('VALIDATION_400')
  })

  it('拒绝空白留言字段和非法下载地址', async () => {
    const user = await login(app, 'demo_user')
    const blank = await user.post('/api/v1/support/messages', {
      name: '   ', email: 'blank-e2e@example.com', subject: '   ', content: '          '
    })
    expect(blank.status).toBe(400)
    expect(blank.body.code).toBe('VALIDATION_400')

    const admin = await login(app, 'admin')
    const invalidUrl = await admin.post('/api/v1/admin/support/downloads', {
      title: '非法地址', category: 'manual', fileUrl: 'javascript:alert(1)', visibility: 'PUBLIC', status: 'DRAFT'
    })
    expect(invalidUrl.status).toBe(400)
    expect(invalidUrl.body.code).toBe('VALIDATION_400')
  })

  it('并发提交相同邮箱和主题只保存一条留言', async () => {
    const user = await login(app, 'demo_user')
    const input = { name: '并发测试', email: 'concurrent-e2e@example.com', subject: `并发主题-${Date.now()}`, content: '用于验证并发幂等的留言内容。' }
    const results = await Promise.all([user.post('/api/v1/support/messages', input), user.post('/api/v1/support/messages', input)])
    expect(results.filter((response) => response.status === 201)).toHaveLength(1)
    expect(results.filter((response) => response.status === 400)).toHaveLength(1)
  })

  it('普通用户不能访问管理员留言，管理员可以处理状态', async () => {
    const user = await login(app, 'demo_user')
    const forbidden = await user.get('/api/v1/admin/support/messages')
    expect(forbidden.status).toBe(403)

    const admin = await login(app, 'admin')
    const list = await admin.get('/api/v1/admin/support/messages').expect(200)
    expect(list.body.data.total).toBeGreaterThan(0)
    const id = list.body.data.items[0].id
    const processing = await admin.patch(`/api/v1/admin/support/messages/${id}/status`, { status: 'PROCESSING', handleNote: '已分派处理' })
    expect(processing.status).toBe(200)
    expect(processing.body.data.status).toBe('PROCESSING')
    const done = await admin.patch(`/api/v1/admin/support/messages/${id}/status`, { status: 'DONE', handleNote: '已回复' })
    expect(done.status).toBe(200)
    expect(done.body.data.status).toBe('DONE')

    const invalidTransition = await admin.patch(`/api/v1/admin/support/messages/${id}/status`, { status: 'PROCESSING' })
    expect(invalidTransition.status).toBe(409)
  })

  it('下载资源按角色过滤，普通用户不能打开经销商资料', async () => {
    const user = await login(app, 'demo_user')
    const userList = await user.get('/api/v1/downloads').expect(200)
    expect(userList.body.data.some((item: { visibility: string }) => item.visibility === 'DEALER')).toBe(false)
    expect(userList.body.data.some((item: { visibility: string }) => item.visibility === 'USER')).toBe(true)
    const dealer = await login(app, 'dealer_demo')
    const dealerList = await dealer.get('/api/v1/downloads').expect(200)
    expect(dealerList.body.data.some((item: { visibility: string }) => item.visibility === 'DEALER')).toBe(true)

    const dealerResource = dealerList.body.data.find((item: { visibility: string }) => item.visibility === 'DEALER')
    const denied = await user.get(`/api/v1/downloads/${dealerResource.id}/access`)
    expect(denied.status).toBe(403)
    const allowed = await dealer.get(`/api/v1/downloads/${dealerResource.id}/access`)
    expect(allowed.status).toBe(200)
    expect(allowed.body.data.fileUrl).toMatch(/^\//)

    const admin = await login(app, 'admin')
    const faq = await admin.post('/api/v1/admin/support/faqs', { question: '局部更新验收', answer: '原始答案', category: '测试', status: 'DRAFT' })
    expect(faq.status).toBe(201)
    const faqId = faq.body.data.id
    const faqPatch = await admin.patch(`/api/v1/admin/support/faqs/${faqId}`, { status: 'PUBLISHED' })
    expect(faqPatch.status).toBe(200)
    expect(faqPatch.body.data.status).toBe('PUBLISHED')
    await admin.patch(`/api/v1/admin/support/faqs/${faqId}`, { status: 'DRAFT' })
    const deleted = await admin.delete(`/api/v1/admin/support/faqs/${faqId}`)
    expect(deleted.status).toBe(200)

    const adminDownloads = await admin.get('/api/v1/admin/support/downloads').expect(200)
    const counted = adminDownloads.body.data.find((item: { id: string }) => item.id === dealerResource.id)
    expect(Number(counted.downloadCount)).toBeGreaterThan(0)
  })
})
