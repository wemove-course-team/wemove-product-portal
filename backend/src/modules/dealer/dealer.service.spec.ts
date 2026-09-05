import { ForbiddenException } from '@nestjs/common'
import { DealerService } from './dealer.service'
import { SessionGuard } from '../identity/auth.guard'
import { SessionService } from '../identity/session.service'
import { DealerAdminController } from './dealer.controller'

function repo<T extends Record<string, any>>(items: T[] = []) {
  return {
    items,
    findOne: jest.fn(async ({ where }: any) => {
      const clauses = Array.isArray(where) ? where : [where]
      return items.find((item) => clauses.some((clause) => Object.entries(clause).every(([key, value]) => item[key] === value))) || null
    }),
    find: jest.fn(async () => items),
    create: jest.fn((value: T) => value),
    save: jest.fn(async (value: any) => { if (value.id == null) value.id = (items.length + 1) as any; const index = items.findIndex((item) => item.id === value.id); if (index >= 0) items[index] = value; else items.push(value); return value }),
    update: jest.fn(async (where: any, changes: any) => { const item = items.find((candidate) => candidate.id === where.id); if (item) Object.assign(item, changes) }),
    createQueryBuilder: jest.fn(() => ({ orderBy() { return this }, skip() { return this }, take() { return this }, where() { return this }, getManyAndCount: async () => [items, items.length] }))
  }
}

describe('DealerService', () => {
  it('binds a logged-in user and creates a pending application', async () => {
    const apps = repo<any>(); const companies = repo<any>(); const users = repo<any>(); const service = new DealerService(apps as any, companies as any, users as any, {} as any, { refreshUser: jest.fn() } as any)
    const result = await service.create({ id: 7, role: 'USER' } as any, { companyName: '测试企业', taxId: 'TAX-1', businessType: '零售', region: '华东', contactName: '李明', phone: '13800000000', email: 'li@example.com', annualTarget: '50万' })
    expect(result.status).toBe('PENDING')
    expect(result.userId).toBe('7')
    expect(apps.items).toHaveLength(1)
  })

  it('rejects a duplicate pending application with 409', async () => {
    const apps = repo<any>([{ id: 'APP-1', userId: 7, status: 'PENDING' }]); const service = new DealerService(apps as any, repo() as any, repo() as any, {} as any, { refreshUser: jest.fn() } as any)
    await expect(service.create({ id: 7 } as any, { companyName: '测试企业', taxId: 'TAX-1', businessType: '零售', region: '华东', contactName: '李明', phone: '13800000000', email: 'li@example.com', annualTarget: '50万' })).rejects.toMatchObject({ status: 409 })
  })

  it('promotes the applicant to DEALER in the approval transaction', async () => {
    const application = { id: 'APP-1', userId: 7, companyName: '测试企业', taxId: 'TAX-1', businessType: '零售', region: '华东', contactName: '李明', phone: '13800000000', email: 'li@example.com', annualTarget: '50万', status: 'PENDING', salesChannels: null, tierName: null, discountRate: null, auditNote: null, auditedAt: null, createdAt: new Date() }
    const apps = repo<any>([application]); const companies = repo<any>(); const users = repo<any>([{ id: 7, role: 'USER', companyId: null }]); const manager = { getRepository: (entity: any) => entity.name === 'DealerApplication' ? apps : entity.name === 'DealerCompany' ? companies : users }; const service = new DealerService(apps as any, companies as any, users as any, { transaction: async (callback: any) => callback(manager) } as any, { refreshUser: jest.fn() } as any)
    const result = await service.review('APP-1', { action: 'APPROVED', auditNote: '资料齐全', tierName: '一级经销商', discountRate: 0.65 })
    expect(result.status).toBe('APPROVED'); expect(users.items[0].role).toBe('DEALER'); expect(users.items[0].companyId).toBe(1)
  })

  it('does not expose the portal to a regular user', async () => {
    const service = new DealerService(repo() as any, repo() as any, repo() as any, {} as any, { refreshUser: jest.fn() } as any)
    await expect(service.portal({ id: 7, role: 'USER' } as any)).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('returns 401 when the session cookie is missing', () => {
    const guard = new SessionGuard(new SessionService())
    const context = { switchToHttp: () => ({ getRequest: () => ({ cookies: {} }) }) } as any
    expect(() => guard.canActivate(context)).toThrow(/请先登录/)
  })

  it('returns 403 when a regular user calls the admin list', async () => {
    const controller = new DealerAdminController({ list: jest.fn() } as any)
    await expect(controller.list({ user: { role: 'USER' } } as any)).rejects.toMatchObject({ status: 403 })
  })
})
