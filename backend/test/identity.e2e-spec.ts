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

function cookies(res: { headers: Record<string, unknown> }): string {
  return ((res.headers['set-cookie'] as string[] | undefined) || []).map((value) => value.split(';')[0]).join('; ')
}

async function createApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile()
  const app = moduleRef.createNestApplication()
  configureApp(app)
  await app.init()
  return app
}

async function login(app: INestApplication, identifier: string) {
  const server = request(app.getHttpServer())
  const csrf = await server.get('/api/v1/auth/csrf').expect(200)
  const response = await server.post('/api/v1/auth/login')
    .set('Cookie', cookies(csrf))
    .set('X-CSRF-Token', csrf.body.data.csrfToken)
    .send({ identifier, password: 'Wemove@123' })
    .expect(200)
  const sessionCookie = cookies(response)
  return {
    sessionCookie,
    get: (path: string) => server.get(path).set('Cookie', sessionCookie),
    patch: async (path: string, body: object): Promise<Response> => {
      const fresh = await server.get('/api/v1/auth/csrf').expect(200)
      return server.patch(path)
        .set('Cookie', `${sessionCookie}; ${cookies(fresh)}`)
        .set('X-CSRF-Token', fresh.body.data.csrfToken)
        .send(body)
    }
  }
}

describe('Identity 管理员用户闭环 (e2e)', () => {
  let app: INestApplication

  beforeAll(async () => {
    await setupTestDatabase()
    app = await createApp()
  }, 120000)

  afterAll(async () => {
    if (app) await app.close()
  })

  it('游客返回 401，普通用户返回 403', async () => {
    await request(app.getHttpServer()).get('/api/v1/admin/users').expect(401)
    const user = await login(app, 'demo_user')
    await user.get('/api/v1/admin/users').expect(403)
  })

  it('管理员分页查询不泄露密码字段', async () => {
    const admin = await login(app, 'admin')
    const response = await admin.get('/api/v1/admin/users?page=1&pageSize=20&status=1').expect(200)
    expect(response.body.data.items.length).toBeGreaterThanOrEqual(3)
    expect(response.body.data.items[0]).not.toHaveProperty('passwordHash')
    expect(response.body.data).toMatchObject({ page: 1, pageSize: 20, total: expect.any(Number) })
  })

  it('停用用户后旧会话失效，重启后状态保留，再由管理员恢复', async () => {
    const admin = await login(app, 'admin')
    const user = await login(app, 'demo_user')
    const list = await admin.get('/api/v1/admin/users?keyword=demo_user').expect(200)
    const target = list.body.data.items.find((item: { username: string }) => item.username === 'demo_user')

    await admin.patch(`/api/v1/admin/users/${target.id}/status`, { status: 0 }).then((res) => expect(res.status).toBe(200))
    await user.get('/api/v1/auth/me').expect(401)

    await app.close()
    app = await createApp()
    const restartedAdmin = await login(app, 'admin')
    const persisted = await restartedAdmin.get('/api/v1/admin/users?keyword=demo_user').expect(200)
    expect(persisted.body.data.items[0].status).toBe(0)
    await restartedAdmin.patch(`/api/v1/admin/users/${target.id}/status`, { status: 1 }).then((res) => expect(res.status).toBe(200))
  })

  it('管理员不能停用自己', async () => {
    const admin = await login(app, 'admin')
    const me = await admin.get('/api/v1/auth/me').expect(200)
    const response = await admin.patch(`/api/v1/admin/users/${me.body.data.id}/status`, { status: 0 })
    expect(response.status).toBe(409)
    expect(response.body.code).toBe('CONFLICT_409')
  })
})
