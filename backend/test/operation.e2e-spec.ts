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

  const plainAfter = request(app.getHttpServer())
  async function write(method: 'post' | 'put' | 'delete', path: string, body?: object) {
    const fresh = await plainAfter.get('/api/v1/auth/csrf').expect(200)
    const req = plainAfter[method](path)
      .set('Cookie', `${sessionCookie}; ${cookies(fresh)}`)
      .set('X-CSRF-Token', fresh.body.data.csrfToken)
    if (body) req.send(body)
    return req
  }

  return {
    sessionCookie,
    get: (path) => plainAfter.get(path).set('Cookie', sessionCookie),
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

describe('Operation 站点配置 / Banner / 概览 (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    await setupTestDatabase()
    app = await createApp()
  }, 120000)

  afterAll(async () => {
    if (app) await app.close()
  })

  describe('站点配置', () => {
    it('GET /api/v1/site/config：公开返回全部白名单键，且为 MVP-07 seed 默认值', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/site/config')

      expect(res.status).toBe(200)
      expect(res.body).toMatchObject({ code: 0, message: 'ok' })
      expect(Object.keys(res.body.data).sort()).toEqual(
        ['address', 'contactEmail', 'contactPhone', 'footerText', 'icpNo', 'logoUrl', 'siteName'].sort()
      )
      // seed 已在新测试库实际执行：默认站点名来自 seed_operation_mvp07.sql
      expect(res.body.data.siteName).toBe('WEMOVE 惟木匠心')

      // MVP-07 迁移+seed 已执行：seed 内置的 2 条演示 Banner 可公开读取
      const banners = await request(app.getHttpServer()).get('/api/v1/banners')
      expect(banners.status).toBe(200)
      const titles = (banners.body.data as any[]).map((b) => b.title)
      expect(titles).toEqual(expect.arrayContaining(['儿童实木保龄球套装', '极简弧形摇摆平衡板']))
    })

    it('游客访问 PUT /api/v1/admin/site/config 返回 401（携带有效 CSRF 对通过 CSRF 后由 SessionGuard 拒绝）', async () => {
      const server = app.getHttpServer()
      const csrf = await request(server).get('/api/v1/auth/csrf').expect(200)
      const res = await request(server)
        .put('/api/v1/admin/site/config')
        .set('Cookie', cookies(csrf))
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .send({ siteName: 'hack' })

      expect(res.status).toBe(401)
      expect(res.body.code).toBe('AUTH_401')
    })

    it('普通用户访问管理配置接口返回 403', async () => {
      const user = await loginAs(app, 'demo_user')
      const res = await user.put('/api/v1/admin/site/config', { siteName: 'x' })

      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN_403')
    })

    it('管理员写请求缺失 CSRF Token 返回 403', async () => {
      const admin = await loginAs(app, 'admin')
      const res = await request(app.getHttpServer())
        .put('/api/v1/admin/site/config')
        .set('Cookie', admin.sessionCookie)
        .send({ siteName: '无 CSRF 的写入' })

      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN_403')

      // 数据未被修改
      const publicRes = await request(app.getHttpServer()).get('/api/v1/site/config')
      expect(publicRes.body.data.siteName).not.toBe('无 CSRF 的写入')
    })

    it('管理员更新白名单配置后，公开配置接口读取新值', async () => {
      const admin = await loginAs(app, 'admin')
      const updateRes = await admin.put('/api/v1/admin/site/config', {
        siteName: 'WEMOVE E2E 站名',
        contactPhone: '13800001111',
        logoUrl: '/images/prod_20_1.jpg'
      })

      expect(updateRes.status).toBe(200)
      expect(updateRes.body.data.siteName).toBe('WEMOVE E2E 站名')

      const publicRes = await request(app.getHttpServer()).get('/api/v1/site/config')
      expect(publicRes.body.data.siteName).toBe('WEMOVE E2E 站名')
      expect(publicRes.body.data.contactPhone).toBe('13800001111')
    })

    it('非白名单键被拒绝（400），不落库', async () => {
      const admin = await loginAs(app, 'admin')
      const res = await admin.put('/api/v1/admin/site/config', {
        siteName: '合法值',
        evilKey: 'hack'
      })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('VALIDATION_400')
      expect(res.body.errors).toEqual(
        expect.arrayContaining([expect.objectContaining({ field: 'evilKey' })])
      )

      const publicRes = await request(app.getHttpServer()).get('/api/v1/site/config')
      expect(publicRes.body.data).not.toHaveProperty('evilKey')
    })

    it('非法 URL（javascript: 伪协议）返回 400', async () => {
      const admin = await loginAs(app, 'admin')
      const res = await admin.put('/api/v1/admin/site/config', {
        logoUrl: 'javascript:alert(1)'
      })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('VALIDATION_400')
    })
  })

  describe('Banner', () => {
    let idA: string
    let idB: string

    it('游客访问管理 Banner 接口返回 401，普通用户返回 403，缺失 CSRF 返回 403', async () => {
      // 游客写请求必须携带有效 CSRF 对，先通过全局 CsrfGuard 后由 SessionGuard 返回 401；
      // 未携带/错误 CSRF 会在 CsrfGuard 处直接 403。
      const server = app.getHttpServer()
      const csrf = await request(server).get('/api/v1/auth/csrf').expect(200)
      const anonWithCsrf = await request(server)
        .post('/api/v1/admin/banners')
        .set('Cookie', cookies(csrf))
        .set('X-CSRF-Token', csrf.body.data.csrfToken)
        .send({ title: 'x', imageUrl: '/images/prod_20_1.jpg' })
      expect(anonWithCsrf.status).toBe(401)
      expect(anonWithCsrf.body.code).toBe('AUTH_401')

      const anonNoCsrf = await request(server)
        .post('/api/v1/admin/banners')
        .send({ title: 'x', imageUrl: '/images/prod_20_1.jpg' })
      expect(anonNoCsrf.status).toBe(403)
      expect(anonNoCsrf.body.code).toBe('FORBIDDEN_403')

      const user = await loginAs(app, 'demo_user')
      const forbidden = await user.get('/api/v1/admin/banners')
      expect(forbidden.status).toBe(403)
      expect(forbidden.body.code).toBe('FORBIDDEN_403')
    })

    it('管理员新增 Banner 真实写入 MySQL', async () => {
      const admin = await loginAs(app, 'admin')
      const resA = await admin.post('/api/v1/admin/banners', {
        title: '横幅A',
        imageUrl: '/images/prod_14_1.jpg',
        linkUrl: '/products',
        sortOrder: 10
      })
      const resB = await admin.post('/api/v1/admin/banners', {
        title: '横幅B',
        imageUrl: '/images/prod_15_1.jpg',
        sortOrder: 5,
        isActive: false
      })

      expect(resA.status).toBe(201)
      expect(resA.body.data).toMatchObject({ title: '横幅A', sortOrder: 10, isActive: true })
      expect(resB.status).toBe(201)
      idA = String(resA.body.data.id)
      idB = String(resB.body.data.id)

      const dbCheck = await app.get(DataSource).query('SELECT id, title FROM banner ORDER BY id')
      expect(dbCheck.length).toBeGreaterThanOrEqual(2)
    })

    it('Banner 公开列表仅返回启用项，按 sortOrder、id 稳定排序（含 seed 默认项）', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/banners')

      expect(res.status).toBe(200)
      const items = res.body.data
      expect(Array.isArray(items)).toBe(true)
      // 横幅B（isActive=false）不可见
      expect(items.some((b: any) => String(b.id) === idB)).toBe(false)
      expect(items.some((b: any) => String(b.id) === idA)).toBe(true)
      for (let i = 1; i < items.length; i += 1) {
        const prev = items[i - 1]
        const cur = items[i]
        expect(prev.sortOrder < cur.sortOrder || (prev.sortOrder === cur.sortOrder && prev.id < cur.id)).toBe(true)
      }
    })

    it('非法排序与非法 URL 被拒绝（400）', async () => {
      const admin = await loginAs(app, 'admin')
      const badSort = await admin.post('/api/v1/admin/banners', {
        title: 'x',
        imageUrl: '/images/prod_20_1.jpg',
        sortOrder: -3
      })
      expect(badSort.status).toBe(400)

      const badUrl = await admin.put(`/api/v1/admin/banners/${idA}`, {
        imageUrl: 'javascript:alert(1)'
      })
      expect(badUrl.status).toBe(400)
    })

    it('管理员编辑、启停 Banner，公开列表实时反映', async () => {
      const admin = await loginAs(app, 'admin')
      const edit = await admin.put(`/api/v1/admin/banners/${idA}`, {
        title: '横幅A-已编辑',
        linkUrl: '/products?featured=1'
      })
      expect(edit.status).toBe(200)
      expect(edit.body.data.title).toBe('横幅A-已编辑')

      const disable = await admin.put(`/api/v1/admin/banners/${idA}/status`, { isActive: false })
      expect(disable.status).toBe(200)
      expect(disable.body.data.isActive).toBe(false)

      const list = await request(app.getHttpServer()).get('/api/v1/banners')
      expect(list.body.data.some((b: any) => String(b.id) === idA)).toBe(false)

      const enable = await admin.put(`/api/v1/admin/banners/${idA}/status`, { isActive: true })
      expect(enable.body.data.isActive).toBe(true)
    })

    it('管理员批量排序真实写入', async () => {
      const admin = await loginAs(app, 'admin')
      const sortRes = await admin.put('/api/v1/admin/banners/sort', {
        items: [
          { id: idA, sortOrder: 100 },
          { id: idB, sortOrder: 90 }
        ]
      })
      expect(sortRes.status).toBe(200)

      const adminList = await admin.get('/api/v1/admin/banners')
      const sorted = adminList.body.data as any[]
      const posA = sorted.findIndex((b) => String(b.id) === idA)
      const posB = sorted.findIndex((b) => String(b.id) === idB)
      expect(posB).toBeLessThan(posA)
      expect(sorted[posA].sortOrder).toBe(100)
    })

    it('管理员删除 Banner 后公开列表与详情均不可见', async () => {
      const admin = await loginAs(app, 'admin')
      const del = await admin.delete(`/api/v1/admin/banners/${idB}`)
      expect(del.status).toBe(200)

      const notFound = await admin.delete(`/api/v1/admin/banners/${idB}`)
      expect(notFound.status).toBe(404)
      expect(notFound.body.code).toBe('NOT_FOUND_404')

      const adminList = await admin.get('/api/v1/admin/banners')
      expect(adminList.body.data.some((b: any) => String(b.id) === idB)).toBe(false)
    })
  })

  describe('后台概览', () => {
    it('游客访问概览返回 401，普通用户返回 403', async () => {
      const anon = await request(app.getHttpServer()).get('/api/v1/admin/stats/overview')
      expect(anon.status).toBe(401)

      const user = await loginAs(app, 'demo_user')
      const forbidden = await user.get('/api/v1/admin/stats/overview')
      expect(forbidden.status).toBe(403)
    })

    it('管理员获取真实统计（seed 基线非零），且不含 pendingMessages', async () => {
      const admin = await loginAs(app, 'admin')
      const res = await admin.get('/api/v1/admin/stats/overview')

      expect(res.status).toBe(200)
      expect(res.body.data).toMatchObject({
        productCount: expect.any(Number),
        articleCount: expect.any(Number),
        userCount: expect.any(Number),
        pendingApplications: expect.any(Number)
      })
      expect(res.body.data.productCount).toBeGreaterThan(0)
      expect(res.body.data.userCount).toBeGreaterThanOrEqual(3)
      expect(res.body.data).not.toHaveProperty('pendingMessages')

      // 与数据库真实 COUNT 对账
      const ds = app.get(DataSource)
      const [[{ cnt: productCnt }]] = await ds.query('SELECT COUNT(*) AS cnt FROM `product`')
      expect(res.body.data.productCount).toBe(Number(productCnt))
    })
  })

  describe('持久化（重启保留）', () => {
    it('配置与 Banner 写入真实 MySQL：重启应用后数据仍在', async () => {
      const before = await request(app.getHttpServer()).get('/api/v1/site/config')
      const bannersBefore = await request(app.getHttpServer()).get('/api/v1/banners')

      await app.close()
      app = await createApp()

      const after = await request(app.getHttpServer()).get('/api/v1/site/config')
      expect(after.body.data.siteName).toBe(before.body.data.siteName)

      const bannersAfter = await request(app.getHttpServer()).get('/api/v1/banners')
      expect(bannersAfter.body.data).toEqual(bannersBefore.body.data)
    })
  })
})
