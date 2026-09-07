import { ConflictException, ForbiddenException } from '@nestjs/common'
import { DealerService } from './dealer.service'

function repository(items: any[] = []) {
  const matches = (item: any, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => item[key] === value)

  return {
    items,
    findOne: jest.fn(async ({ where }: any) => {
      const clauses = Array.isArray(where) ? where : [where]
      return items.find((item) => clauses.some((clause) => matches(item, clause))) || null
    }),
    find: jest.fn(async () => items),
    create: jest.fn((value: any) => value),
    save: jest.fn(async (value: any) => {
      if (value.id == null) value.id = items.length + 1
      const index = items.findIndex((item) => item.id === value.id)
      if (index >= 0) items[index] = value
      else items.push(value)
      return value
    }),
    update: jest.fn(async (where: any, changes: any) => {
      const item = items.find((candidate) => candidate.id === where.id)
      if (item) Object.assign(item, changes)
    }),
    createQueryBuilder: jest.fn(() => ({
      orderBy() { return this },
      skip() { return this },
      take() { return this },
      andWhere() { return this },
      getManyAndCount: async () => [items, items.length]
    }))
  }
}

describe('DealerService', () => {
  it('绑定当前用户并创建待审核申请', async () => {
    const applications = repository()
    const users = repository([{ id: 7, status: 1 }])
    const dataSource = { transaction: async (callback: any) => callback({ getRepository: (entity: any) => entity.name === 'User' ? users : applications }) }
    const service = new DealerService(applications as any, repository() as any, users as any, dataSource as any)

    const result = await service.create(
      { id: 7 } as any,
      {
        companyName: '测试企业',
        taxId: 'TAX-1',
        businessType: '零售',
        region: '华东',
        contactName: '李明',
        phone: '13800000000',
        email: 'li@example.com',
        annualTarget: '50万'
      }
    )

    expect(result).toMatchObject({ userId: '7', status: 'PENDING' })
    expect(applications.items).toHaveLength(1)
  })

  it('拒绝同一用户的重复申请', async () => {
    const applications = repository([{ id: 'APP-1', userId: 7, status: 'PENDING' }])
    const users = repository([{ id: 7, status: 1 }])
    const dataSource = { transaction: async (callback: any) => callback({ getRepository: (entity: any) => entity.name === 'User' ? users : applications }) }
    const service = new DealerService(applications as any, repository() as any, users as any, dataSource as any)

    await expect(
      service.create({ id: 7 } as any, { companyName: '测试企业' } as any)
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('普通用户不能访问经销商门户', async () => {
    const service = new DealerService(repository() as any, repository() as any, repository() as any, {} as any)

    await expect(service.portal({ id: 7, role: 'USER' } as any)).rejects.toBeInstanceOf(ForbiddenException)
  })

  it('审核通过后将用户升级为 DEALER', async () => {
    const application = {
      id: 'APP-1',
      userId: 7,
      companyName: '测试企业',
      taxId: 'TAX-1',
      businessType: '零售',
      region: '华东',
      contactName: '李明',
      phone: '13800000000',
      email: 'li@example.com',
      annualTarget: '50万',
      salesChannels: null,
      status: 'PENDING',
      tierName: null,
      discountRate: null,
      auditNote: null,
      auditedAt: null,
      createdAt: new Date()
    }
    const applications = repository([application])
    const companies = repository()
    const users = repository([{ id: 7, role: 'USER', companyId: null }])
    const manager = {
      getRepository: (entity: any) => entity.name === 'DealerApplication' ? applications : entity.name === 'DealerCompany' ? companies : users
    }
    const dataSource = { transaction: async (callback: any) => callback(manager) }
    const service = new DealerService(applications as any, companies as any, users as any, dataSource as any)

    const result = await service.review('APP-1', { action: 'APPROVED', auditNote: '资料齐全' })

    expect(result.status).toBe('APPROVED')
    expect(users.items[0]).toMatchObject({ role: 'DEALER', companyId: 1 })
  })
})
