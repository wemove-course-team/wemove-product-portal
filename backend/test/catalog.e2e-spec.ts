import { Test } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import type { Response } from 'superagent'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app-setup'
import { setupTestDatabase } from './setup-db'

/**
 * 产品目录域端到端测试（#87 MVP-03）。
 *
 * 与课程“测试报告（测试用例）”同源：对真实 MySQL + 完整 Nest 应用发起 HTTP 请求，
 * 覆盖 #87 验收项与冻结契约——统一信封、分页上限、关键词检索、角色裁剪、
 * 权限区分（401/403）、CSRF、SKU/slug 唯一（409）、草稿/下架不可见、管理端 CRUD 闭环。
 *
 * 运行前提：本机 3306 有可连接的 MySQL（CI 由 service 容器提供），库由 setup-db 全自动初始化。
 *   npm run test:e2e
 */

// 环境变量需在 AppModule 装配（ConfigModule 读取）前写入
process.env.DB_HOST = process.env.DB_HOST || '127.0.0.1'
process.env.DB_PORT = process.env.DB_PORT || '3306'
process.env.DB_USER = process.env.DB_USER || 'root'
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'wemove123'
process.env.DB_NAME = process.env.E2E_DB_NAME || 'wemove_portal_test'

/** 取响应中可回传的 Cookie 片段（name=value; ...） */
function sentCookies(res: { headers: Record<string, unknown> }): string {
  const raw = (res.headers['set-cookie'] as string[] | undefined) ?? []
  return raw.map((c) => c.split(';')[0]).join('; ')
}

/**
 * 登录后的请求客户端：显式管理 Cookie（会话 + CSRF），不依赖 supperagent 的
 * Cookie jar——其 jar 对 CSRF 轮换存在一轮滞后，会导致双提交校验随机失败。
 * 每次写请求自动取新鲜 CSRF token，并把配对的 Cookie 与 Header 一起下发。
 */
interface AuthedClient {
  /** 会话 Cookie（wemove_session=...），供“缺少 CSRF”等特殊用例手工构造请求 */
  sessionCookie: string
  get: (url: string) => Promise<Response>
  post: (url: string, body?: object) => Promise<Response>
  put: (url: string, body?: object) => Promise<Response>
  delete: (url: string) => Promise<Response>
}

async function loginAs(app: INestApplication, identifier: string, password: string): Promise<AuthedClient> {
  const server = app.getHttpServer()
  const plain = request(server)

  const pre = await plain.get('/api/v1/auth/csrf').expect(200)
  const csrfCookie = sentCookies(pre)
  const login = await plain
    .post('/api/v1/auth/login')
    .set('Cookie', csrfCookie)
    .set('X-CSRF-Token', pre.body.data.csrfToken)
    .send({ identifier, password })
    .expect(200)
  const sessionCookie = sentCookies(login)

  async function freshCsrf(): Promise<string> {
    const res = await plain.get('/api/v1/auth/csrf')
    return res.body.data.csrfToken
  }

  return {
    sessionCookie,
    get: (url) => plain.get(url).set('Cookie', sessionCookie),
    post: async (url, body) => {
      const token = await freshCsrf()
      return plain
        .post(url)
        .set('Cookie', `${sessionCookie}; wemove_csrf=${token}`)
        .set('X-CSRF-Token', token)
        .send(body ?? {})
    },
    put: async (url, body) => {
      const token = await freshCsrf()
      return plain
        .put(url)
        .set('Cookie', `${sessionCookie}; wemove_csrf=${token}`)
        .set('X-CSRF-Token', token)
        .send(body ?? {})
    },
    delete: async (url) => {
      const token = await freshCsrf()
      return plain
        .delete(url)
        .set('Cookie', `${sessionCookie}; wemove_csrf=${token}`)
        .set('X-CSRF-Token', token)
    }
  }
}

describe('Catalog API (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    await setupTestDatabase()

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
    app = moduleRef.createNestApplication()
    // 与生产入口 main.ts 走同一套装配（信封/错误体/CSRF/RequestId）
    configureApp(app)
    await app.init()
  }, 120000)

  afterAll(async () => {
    await app.close()
  })

  // ============================ 公开目录接口 ============================

  describe('GET /products 公开列表', () => {
    it('返回统一信封与分页结构，列表项不含任何经销商字段', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?page=1&pageSize=5')

      expect(res.status).toBe(200)
      expect(res.headers['x-request-id']).toBeTruthy()
      expect(res.body).toMatchObject({ code: 0, message: 'ok' })
      expect(res.body.data).toMatchObject({ page: 1, pageSize: 5 })
      expect(typeof res.body.data.total).toBe('number')
      expect(Array.isArray(res.body.data.items)).toBe(true)
      expect(res.body.data.items.length).toBeLessThanOrEqual(5)

      for (const item of res.body.data.items) {
        expect(item).not.toHaveProperty('dealerPrice')
        expect(item).not.toHaveProperty('moq')
        expect(item).toHaveProperty('coverImage')
        expect(item).toHaveProperty('categoryName')
      }
    })

    it('只返回已发布产品（seed 13 款发布 / 1 款草稿）', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?pageSize=50')

      expect(res.body.data.total).toBe(13)
      const slugs = res.body.data.items.map((i: { slug: string }) => i.slug)
      expect(slugs).not.toContain('custom-wooden-bookshelf') // 草稿
      expect(slugs).toContain('kids-bowling-set')
    })

    it('分页：page=2&pageSize=5 返回第二页且不重复', async () => {
      const page1 = await request(app.getHttpServer()).get('/api/v1/products?page=1&pageSize=5')
      const page2 = await request(app.getHttpServer()).get('/api/v1/products?page=2&pageSize=5')

      expect(page2.body.data).toMatchObject({ page: 2, pageSize: 5 })
      const ids1 = page1.body.data.items.map((i: { id: string }) => i.id)
      const ids2 = page2.body.data.items.map((i: { id: string }) => i.id)
      expect(ids1.filter((id: string) => ids2.includes(id))).toHaveLength(0)
    })

    it('pageSize 超过上限 50 时被钳制（#85 契约）', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?pageSize=999')
      expect(res.body.data.pageSize).toBe(50)
    })

    it('keyword 命中产品名称（SEA-004）', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/products?keyword=%E6%BB%9A%E7%8F%A0') // 滚珠
      expect(res.status).toBe(200)
      expect(res.body.data.total).toBeGreaterThanOrEqual(1)
      expect(res.body.data.items.length).toBeGreaterThan(0)
    })

    it('keyword=SKU 精确命中', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?keyword=WM-FUR-T01')
      expect(res.body.data.total).toBe(1)
      expect(res.body.data.items[0]).toMatchObject({ sku: 'WM-FUR-T01', categoryName: '家具定制' })
    })

    it('categoryId 过滤：只返回该分类产品', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?categoryId=2')
      expect(res.body.data.total).toBe(2)
      for (const item of res.body.data.items) {
        expect(item.categoryName).toBe('家具定制')
      }
    })

    it('categoryId=0 等非法值返回 400 + errors 数组', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?categoryId=0')
      expect(res.status).toBe(400)
      expect(res.body.code).toBe('VALIDATION_400')
      expect(Array.isArray(res.body.errors)).toBe(true)
      expect(res.body.errors[0].field).toBe('categoryId')
    })

    it('featured=1 只返回精选（#86 首页契约）', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?featured=1&pageSize=50')
      expect(res.body.data.total).toBe(6)
      for (const item of res.body.data.items) {
        expect(item.isFeatured).toBe(1)
      }
    })

    it('age=10-plus 按 ageRange 启发式过滤', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?age=10-plus')
      const names = res.body.data.items.map((i: { name: string }) => i.name)
      // '3-8岁' 不命中 12/14/及以上
      expect(names).not.toContain('50块标准款实木积木套装')
    })

    it('sort=price_asc 价格升序', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?sort=price_asc&pageSize=50')
      const prices: number[] = res.body.data.items.map((i: { price: number }) => i.price)
      const sorted = [...prices].sort((a, b) => a - b)
      expect(prices).toEqual(sorted)
    })

    it('page 超出范围返回空 items 而非报错（PLP-006 空态由前端呈现）', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products?page=99')
      expect(res.status).toBe(200)
      expect(res.body.data.items).toHaveLength(0)
    })
  })

  describe('GET /products/:slug 公开详情', () => {
    it('按 slug 返回完整详情结构，游客视角无经销商价格', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products/kids-bowling-set')

      expect(res.status).toBe(200)
      const detail = res.body.data
      expect(detail).toMatchObject({ sku: 'WM-BWL-01', slug: 'kids-bowling-set', price: 198 })
      expect(Array.isArray(detail.images)).toBe(true)
      expect(detail.images.length).toBeGreaterThan(0)
      expect(typeof detail.specs).toBe('object')
      expect(detail).not.toHaveProperty('dealerPrice')
      expect(detail).not.toHaveProperty('moq')
    })

    it('纯数字 key 兼容旧 /product/:id 外链', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/products/101')
      expect(res.status).toBe(200)
      expect(res.body.data.slug).toBe('kids-bowling-set')
    })

    it('草稿与不存在的 slug 返回 404 NOT_FOUND_404', async () => {
      const draft = await request(app.getHttpServer()).get('/api/v1/products/custom-wooden-bookshelf')
      expect(draft.status).toBe(404)
      expect(draft.body.code).toBe('NOT_FOUND_404')

      const ghost = await request(app.getHttpServer()).get('/api/v1/products/no-such-product')
      expect(ghost.status).toBe(404)
      expect(ghost.body.requestId).toBeTruthy()
    })
  })

  describe('GET /categories 分类', () => {
    it('返回 5 个基线分类，productCount 只统计已发布', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/categories')

      expect(res.status).toBe(200)
      const byslug = Object.fromEntries(res.body.data.map((c: { slug: string; productCount: number }) => [c.slug, c]))
      expect(Object.keys(byslug)).toEqual(expect.arrayContaining(['workshop', 'furniture', 'woodlab', 'stem', 'kits']))
      expect(byslug.workshop.productCount).toBe(9)
      expect(byslug.furniture.productCount).toBe(2) // 第 3 款为草稿
      expect(byslug.stem.productCount).toBe(2)
      expect(byslug.kits.productCount).toBe(0)
    })
  })

  // ============================ 经销商价裁剪 ============================

  describe('角色裁剪（与 #90 口径一致）', () => {
    it('DEALER 会话：详情返回 dealerPrice/moq，列表仍不返回', async () => {
      const agent = await loginAs(app, 'dealer_demo', 'Wemove@123')

      const detail = await agent.get('/api/v1/products/kids-study-desk-set')
      expect(detail.status).toBe(200)
      expect(detail.body.data.dealerPrice).toBe(990)
      expect(detail.body.data.moq).toBe(4)

      const list = await agent.get('/api/v1/products?keyword=WM-FUR-T01')
      expect(list.body.data.items[0]).not.toHaveProperty('dealerPrice')
    })

    it('USER 会话：详情同样不返回经销商字段', async () => {
      const agent = await loginAs(app, 'demo_user', 'Wemove@123')
      const detail = await agent.get('/api/v1/products/kids-study-desk-set')
      expect(detail.status).toBe(200)
      expect(detail.body.data).not.toHaveProperty('dealerPrice')
      expect(detail.body.data).not.toHaveProperty('moq')
    })
  })

  // ============================ 权限与安全 ============================

  describe('管理接口权限（决策 D5：401 与 403 必须区分）', () => {
    it('游客访问 /admin/products → 401 AUTH_401', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/admin/products')
      expect(res.status).toBe(401)
      expect(res.body.code).toBe('AUTH_401')
    })

    it('USER 会话访问管理接口 → 403 FORBIDDEN_403', async () => {
      const agent = await loginAs(app, 'demo_user', 'Wemove@123')
      const res = await agent.get('/api/v1/admin/products')
      expect(res.status).toBe(403)
      expect(res.body.code).toBe('FORBIDDEN_403')
    })

    it('写请求缺少 CSRF 头 → 403（双提交校验，决策 D4）', async () => {
      const agent = await loginAs(app, 'admin', 'Wemove@123')
      // 带会话 Cookie 但不带 X-CSRF-Token / 配对 Cookie
      const res = await request(app.getHttpServer())
        .post('/api/v1/admin/products')
        .set('Cookie', agent.sessionCookie)
        .send({ sku: 'WM-CSRF-01', name: 'x', categoryId: 1, price: 1, dealerPrice: 1 })
        .expect(403)
      expect(res.body.code).toBe('FORBIDDEN_403')
    })
  })

  // ============================ 管理端 CRUD 闭环 ============================

  describe('POST/PUT/DELETE /admin/products 管理闭环（验收核心）', () => {
    let admin: AuthedClient
    const SKU = 'WM-E2E-01'

    beforeAll(async () => {
      admin = await loginAs(app, 'admin', 'Wemove@123')
    })

    it('新增产品 → 公开列表与详情立即可见（闭环第 1 步）', async () => {
      const res = await admin.post('/api/v1/admin/products', {
        sku: SKU,
        name: '端到端测试摇马',
        categoryId: 1,
        price: 199,
        dealerPrice: 129,
        moq: 5,
        summary: 'e2e 用例产品',
        images: ['/images/prod_20_1.jpg'],
        specs: { dimensions: '60cm x 30cm' },
        isPublished: 1,
        isFeatured: 0,
        tag: '测试'
      })

      expect(res.status).toBe(201)
      expect(res.body.code).toBe(0)
      expect(res.body.data.slug).toBe('wm-e2e-01') // slug 缺省按 SKU 生成
      const productId = res.body.data.id

      const publicList = await request(app.getHttpServer()).get(`/api/v1/products?keyword=${SKU}`)
      expect(publicList.body.data.total).toBe(1)
      expect(publicList.body.data.items[0]).toMatchObject({ sku: SKU, price: 199 })

      const publicDetail = await request(app.getHttpServer()).get('/api/v1/products/wm-e2e-01')
      expect(publicDetail.status).toBe(200)
      expect(String(publicDetail.body.data.id)).toBe(String(productId))
    })

    it('重复 SKU → 409 CONFLICT_409', async () => {
      const res = await admin.post('/api/v1/admin/products', {
        sku: SKU,
        name: '重复 SKU',
        categoryId: 1,
        price: 1,
        dealerPrice: 1
      })

      expect(res.status).toBe(409)
      expect(res.body.code).toBe('CONFLICT_409')
      expect(res.body.message).toContain(SKU)
    })

    it('重复 slug（不同 SKU）→ 409', async () => {
      const res = await admin.post('/api/v1/admin/products', {
        sku: 'WM-E2E-OTHER',
        slug: 'wm-e2e-01',
        name: '重复 slug',
        categoryId: 1,
        price: 1,
        dealerPrice: 1
      })
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('CONFLICT_409')
    })

    it('非法入参 → 400 VALIDATION_400 + errors 指向字段', async () => {
      const res = await admin.post('/api/v1/admin/products', { sku: 'X', price: 'abc' })

      expect(res.status).toBe(400)
      expect(res.body.code).toBe('VALIDATION_400')
      expect(Array.isArray(res.body.errors)).toBe(true)
      const fields = res.body.errors.map((e: { field: string }) => e.field)
      expect(fields).toContain('sku')
      expect(fields).toContain('name')
    })

    it('编辑价格 → 公开列表同步更新（闭环第 2 步）', async () => {
      const list = await admin.get('/api/v1/admin/products?keyword=' + SKU)
      const productId = list.body.data.items[0].id

      const updated = await admin.put(`/api/v1/admin/products/${productId}`, { price: 233 })
      expect(updated.status).toBe(200)
      expect(updated.body.data.price).toBe(233)

      const publicList = await request(app.getHttpServer()).get(`/api/v1/products?keyword=${SKU}`)
      expect(publicList.body.data.items[0].price).toBe(233)
    })

    it('下架 → 公开详情 404、列表消失；重新发布 → 恢复（验收：下架不进公开列表）', async () => {
      const list = await admin.get('/api/v1/admin/products?keyword=' + SKU)
      const productId = list.body.data.items[0].id

      await admin.put(`/api/v1/admin/products/${productId}/status`, { isPublished: 0 })

      const hiddenDetail = await request(app.getHttpServer()).get('/api/v1/products/wm-e2e-01')
      expect(hiddenDetail.status).toBe(404)
      const hiddenList = await request(app.getHttpServer()).get(`/api/v1/products?keyword=${SKU}`)
      expect(hiddenList.body.data.total).toBe(0)

      await admin.put(`/api/v1/admin/products/${productId}/status`, { isPublished: 1, isFeatured: 1 })
      const again = await request(app.getHttpServer()).get('/api/v1/products?keyword=' + SKU)
      expect(again.body.data.items[0].isFeatured).toBe(1)
    })

    it('删除 → 公开 404（闭环第 3 步；正式下架应走 status 接口）', async () => {
      const list = await admin.get('/api/v1/admin/products?keyword=' + SKU)
      const productId = list.body.data.items[0].id

      const removed = await admin.delete(`/api/v1/admin/products/${productId}`)
      expect(removed.status).toBe(200)

      const gone = await request(app.getHttpServer()).get('/api/v1/products/wm-e2e-01')
      expect(gone.status).toBe(404)
    })
  })

  describe('管理端分类接口', () => {
    let admin: AuthedClient

    beforeAll(async () => {
      admin = await loginAs(app, 'admin', 'Wemove@123')
    })

    it('新增分类出现在公开分类列表（productCount=0）', async () => {
      const res = await admin.post('/api/v1/admin/categories', {
        name: '测试分类',
        slug: 'e2e-cat',
        description: 'e2e',
        sortOrder: 99
      })
      expect(res.status).toBe(201)
      const categoryId = res.body.data.id

      const categories = await request(app.getHttpServer()).get('/api/v1/categories')
      const created = categories.body.data.find((c: { slug: string }) => c.slug === 'e2e-cat')
      expect(created).toMatchObject({ name: '测试分类', productCount: 0 })

      // 空分类可直接删除
      const removed = await admin.delete(`/api/v1/admin/categories/${categoryId}`)
      expect(removed.status).toBe(200)
    })

    it('删除仍有产品的分类 → 409', async () => {
      const list = await admin.get('/api/v1/admin/categories')
      const workshop = list.body.data.find((c: { slug: string }) => c.slug === 'workshop')
      const res = await admin.delete(`/api/v1/admin/categories/${workshop.id}`)
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('CONFLICT_409')
      expect(res.body.message).toContain('益智玩具')
    })

    it('重复分类 slug → 409', async () => {
      const res = await admin.post('/api/v1/admin/categories', { name: '重复分类', slug: 'workshop' })
      expect(res.status).toBe(409)
      expect(res.body.code).toBe('CONFLICT_409')
    })
  })
})
