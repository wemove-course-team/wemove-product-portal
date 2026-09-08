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
  put(path: string, body?: object): Promise<Response>
  delete(path: string): Promise<Response>
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

  async function write(method: 'post' | 'put' | 'delete', path: string, body?: object) {
    const fresh = await plain.get('/api/v1/auth/csrf').expect(200)
    const req = plain[method](path)
      .set('Cookie', `${sessionCookie}; ${cookies(fresh)}`)
      .set('X-CSRF-Token', fresh.body.data.csrfToken)
    if (body) req.send(body)
    return req
  }

  return {
    sessionCookie,
    get: (path) => plain.get(path).set('Cookie', sessionCookie),
    post: (path, body) => write('post', path, body),
    put: (path, body) => write('put', path, body),
    delete: (path) => write('delete', path)
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

describe('Content & CMS API (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    await setupTestDatabase()
    app = await createApp()
  }, 120000)

  afterAll(async () => {
    if (app) await app.close()
  })

  describe('公开栏目单页与文章接口', () => {
    it('GET /api/v1/pages/furniture: 成功返回原木家具单页内容与 sections', async () => {
      const server = app.getHttpServer()
      const res = await request(server).get('/api/v1/pages/furniture')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({
        code: 0,
        message: 'ok',
        data: {
          slug: 'furniture',
          title: '原木家具',
          status: 'PUBLISHED',
          sections: expect.any(Array)
        }
      })
      expect(res.body.data.sections.length).toBeGreaterThan(0)
    })

    it('GET /api/v1/pages/not-found-slug: 不存在返回 404', async () => {
      const server = app.getHttpServer()
      const res = await request(server).get('/api/v1/pages/not-found-slug')

      expect(res.status).toBe(404)
      expect(res.body.code).toBe('NOT_FOUND_404')
    })

    it('GET /api/v1/articles: 成功返回公开已发布文章列表（包含封面图与分类名）', async () => {
      const server = app.getHttpServer()
      const res = await request(server).get('/api/v1/articles?page=1&pageSize=3')

      expect(res.status).toBe(200)
      expect(res.body.data).toMatchObject({
        items: expect.any(Array),
        total: expect.any(Number),
        page: 1,
        pageSize: 3
      })
      expect(res.body.data.items[0]).toHaveProperty('title')
      expect(res.body.data.items[0]).toHaveProperty('slug')
      expect(res.body.data.items[0]).toHaveProperty('categoryName')
    })

    it('GET /api/v1/articles/:slug: 成功读取文章详情', async () => {
      const server = app.getHttpServer()
      const res = await request(server).get('/api/v1/articles/jiangxin-studio-launch')

      expect(res.status).toBe(200)
      expect(res.body.data).toMatchObject({
        slug: 'jiangxin-studio-launch',
        title: '匠心筑梦工作室正式启航',
        status: 'PUBLISHED'
      })
    })

    it('GET /api/v1/article-categories: 成功获取 3 个预设分类', async () => {
      const server = app.getHttpServer()
      const res = await request(server).get('/api/v1/article-categories')

      expect(res.status).toBe(200)
      expect(res.body.data.length).toBeGreaterThanOrEqual(3)
    })
  })

  describe('管理端鉴权与安全防护', () => {
    it('游客访问管理接口返回 401', async () => {
      const server = app.getHttpServer()
      const res = await request(server).get('/api/v1/admin/articles')

      expect(res.status).toBe(401)
      expect(res.body.code).toBe('AUTH_401')
    })

    it('普通用户访问管理接口返回 403', async () => {
      const user = await loginAs(app, 'demo_user')
      const res = await user.get('/api/v1/admin/articles')

      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN_403')
    })

    it('管理员写请求无 CSRF Token 返回 403', async () => {
      const admin = await loginAs(app, 'admin')
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/articles')
        .set('Cookie', admin.sessionCookie)
        .send({ title: '无CSRF文章', slug: 'no-csrf-article' })

      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN_403')
    })
  })

  describe('管理员 CRUD 与闭环流程', () => {
    let testArticleId: string

    it('管理员创建草稿文章，前台公开列表与详情不可见', async () => {
      const admin = await loginAs(app, 'admin')
      const createRes = await admin.post('/api/v1/admin/articles', {
        title: '全自动验收测试草稿文章',
        slug: 'e2e-draft-article-2026',
        categoryId: '1',
        coverImage: '/images/cover.jpg',
        summary: '自动化验收摘要',
        content: '<script>alert("xss")</script>安全正文内容',
        status: 'DRAFT'
      })

      expect(createRes.status).toBe(201)
      expect(createRes.body.data).toMatchObject({
        title: '全自动验收测试草稿文章',
        slug: 'e2e-draft-article-2026',
        status: 'DRAFT'
      })
      expect(createRes.body.data.content).not.toContain('<script>')
      testArticleId = createRes.body.data.id

      // 验证公开详情不可见
      const server = app.getHttpServer()
      const publicGet = await request(server).get('/api/v1/articles/e2e-draft-article-2026')
      expect(publicGet.status).toBe(404)
    })

    it('管理员发布文章后，前台公开详情立即可见', async () => {
      const admin = await loginAs(app, 'admin')
      const updateRes = await admin.put(`/api/v1/admin/articles/${testArticleId}/status`, {
        status: 'PUBLISHED'
      })

      expect(updateRes.status).toBe(200)
      expect(updateRes.body.data.status).toBe('PUBLISHED')
      expect(updateRes.body.data.publishedAt).not.toBeNull()

      // 前台立即可以查到
      const server = app.getHttpServer()
      const publicGet = await request(server).get('/api/v1/articles/e2e-draft-article-2026')
      expect(publicGet.status).toBe(200)
      expect(publicGet.body.data.title).toBe('全自动验收测试草稿文章')
    })

    it('管理员更新栏目单页内容，前台刷新即可反映', async () => {
      const admin = await loginAs(app, 'admin')
      const pagesRes = await admin.get('/api/v1/admin/pages')
      const dreamPage = pagesRes.body.data.find((p: any) => p.slug === 'dream')

      const updatedSections = [{ type: 'Cover', title: '自动化测试更新标题' }]
      const updateRes = await admin.put(`/api/v1/admin/pages/${dreamPage.id}`, {
        title: '积木筑魂（已由测试更新）',
        sectionsJson: JSON.stringify(updatedSections)
      })
      expect(updateRes.status).toBe(200)

      const server = app.getHttpServer()
      const publicPage = await request(server).get('/api/v1/pages/dream')
      expect(publicPage.status).toBe(200)
      expect(publicPage.body.data.title).toBe('积木筑魂（已由测试更新）')
      expect(publicPage.body.data.sections[0].title).toBe('自动化测试更新标题')
    })

    it('管理员清理测试文章', async () => {
      const admin = await loginAs(app, 'admin')
      const delRes = await admin.delete(`/api/v1/admin/articles/${testArticleId}`)
      expect(delRes.status).toBe(200)

      const server = app.getHttpServer()
      const publicGet = await request(server).get('/api/v1/articles/e2e-draft-article-2026')
      expect(publicGet.status).toBe(404)
    })
  })
})
