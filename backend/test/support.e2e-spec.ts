import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication } from '@nestjs/common'
import request from 'supertest'
import { AppModule } from '../src/app.module'
import { configureApp } from '../src/app-setup'
import { setupTestDatabase } from './setup-db' // 👈 改为同级目录引用 './setup-db'

describe('SupportModule (e2e)', () => {
    let app: INestApplication
    let adminCookie: string[] = []
    let userCookie: string[] = []

    beforeAll(async () => {
        // 1. 初始化测试 MySQL 数据库
        await setupTestDatabase()

        // 2. 启动 NestJS 应用
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile()

        app = moduleFixture.createNestApplication()
        configureApp(app)
        await app.init()

        // 3. 获取测试账号 Cookie (按项目实际测试账号调整)
        const adminRes = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ username: 'admin', password: 'password123' })
        adminCookie = (adminRes.get('Set-Cookie') as string[]) || []

        const userRes = await request(app.getHttpServer())
            .post('/api/v1/auth/login')
            .send({ username: 'user', password: 'password123' })
        userCookie = (userRes.get('Set-Cookie') as string[]) || []
    })

    afterAll(async () => {
        await app.close()
    })

    // 1. 留言成功提交
    it('POST /api/v1/support/messages - 提交留言成功', async () => {
        await request(app.getHttpServer())
            .post('/api/v1/support/messages')
            .send({
                name: '张三',
                email: 'zhangsan@example.com',
                subject: '产品咨询',
                content: '请问售后政策是什么？'
            })
            .expect(201)
    })

    // 2. 游客访问后台 401
    it('GET /api/v1/admin/support/messages - 游客访问后台返回 401', async () => {
        await request(app.getHttpServer())
            .get('/api/v1/admin/support/messages')
            .expect(401)
    })

    // 3. 普通用户 403
    it('GET /api/v1/admin/support/messages - 普通用户访问后台返回 403', async () => {
        await request(app.getHttpServer())
            .get('/api/v1/admin/support/messages')
            .set('Cookie', userCookie)
            .expect(403)
    })

    // 4. 管理员处理留言
    it('PATCH /api/v1/admin/support/messages/1/status - 管理员处理留言状态', async () => {
        await request(app.getHttpServer())
            .patch('/api/v1/admin/support/messages/1/status')
            .set('Cookie', adminCookie)
            .send({ status: 'processed' })
            .expect(200)
    })

    // 5. FAQ 管理
    it('FAQ 管理 - 创建并删除 FAQ', async () => {
        const createRes = await request(app.getHttpServer())
            .post('/api/v1/admin/support/faqs')
            .set('Cookie', adminCookie)
            .send({
                category: '通用问题',
                question: '测试问题',
                answer: '测试回答'
            })
            .expect(201)

        const faqId = createRes.body.data?.id || createRes.body.id

        await request(app.getHttpServer())
            .delete(`/api/v1/admin/support/faqs/${faqId}`)
            .set('Cookie', adminCookie)
            .expect(204)
    })

    // 6. 说明书三档过滤 (PUBLIC / USER / DEALER)
    it('GET /api/v1/support/manuals - 说明书权限过滤', async () => {
        // 游客查 PUBLIC
        await request(app.getHttpServer())
            .get('/api/v1/support/manuals')
            .expect(200)

        // 登录用户查 PUBLIC + USER
        await request(app.getHttpServer())
            .get('/api/v1/support/manuals')
            .set('Cookie', userCookie)
            .expect(200)
    })
})