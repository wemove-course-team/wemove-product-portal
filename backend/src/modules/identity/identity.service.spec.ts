import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { IdentityService } from './identity.service'

function repository(items: any[] = []) {
  const matches = (item: any, where: Record<string, unknown>) =>
    Object.entries(where).every(([key, value]) => item[key] === value)

  return {
    items,
    findOne: jest.fn(async ({ where }: any) => {
      const clauses = Array.isArray(where) ? where : [where]
      return items.find((item) => clauses.some((clause) => matches(item, clause))) || null
    }),
    count: jest.fn(async ({ where }: any) => items.filter((item) => matches(item, where)).length),
    create: jest.fn((value: any) => value),
    save: jest.fn(async (value: any) => {
      if (value.id == null) value.id = items.length + 1
      const index = items.findIndex((item) => item.id === value.id)
      if (index >= 0) items[index] = value
      else items.push(value)
      return value
    }),
    update: jest.fn(async () => undefined),
    createQueryBuilder: jest.fn(() => ({
      select() { return this },
      orderBy() { return this },
      andWhere() { return this },
      skip() { return this },
      take() { return this },
      getManyAndCount: async () => [items, items.length]
    }))
  }
}

describe('IdentityService', () => {
  const config = { get: jest.fn((_key: string, fallback: string) => fallback) }
  const jwt = { signAsync: jest.fn() }

  it('注册用户时保存密码哈希并设置 USER 角色', async () => {
    const users = repository()
    const service = new IdentityService(users as any, repository() as any, jwt as any, config as any, {} as any)

    const user = await service.register({
      username: 'demo_user',
      email: 'demo@example.com',
      password: '12345678'
    })

    expect(user.role).toBe('USER')
    expect(user.email).toBe('demo@example.com')
    expect(users.items[0].passwordHash).not.toBe('12345678')
  })

  it('拒绝重复的用户名或邮箱', async () => {
    const users = repository([{ id: 1, username: 'demo_user', email: 'demo@example.com' }])
    const service = new IdentityService(users as any, repository() as any, jwt as any, config as any, {} as any)

    await expect(
      service.register({ username: 'demo_user', email: 'other@example.com', password: '12345678' })
    ).rejects.toBeInstanceOf(ConflictException)
  })

  it('拒绝错误密码和已停用账号', async () => {
    const users = repository([{
      id: 1,
      username: 'demo_user',
      email: 'demo@example.com',
      passwordHash: '$2b$10$invalid',
      status: 0
    }])
    const service = new IdentityService(users as any, repository() as any, jwt as any, config as any, {} as any)

    await expect(service.authenticate('demo_user', '12345678')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('读取当前用户时要求账号有效', async () => {
    const users = repository([{ id: 1, status: 0 }])
    const service = new IdentityService(users as any, repository() as any, jwt as any, config as any, {} as any)

    await expect(service.getById('1')).rejects.toMatchObject({ status: 401 })
  })

  it('限制用户列表的分页参数', async () => {
    const users = repository([{ id: 1, username: 'a', email: 'a@example.com', status: 1 }])
    const service = new IdentityService(users as any, repository() as any, jwt as any, config as any, {} as any)

    const result = await service.listUsers({ page: 0, pageSize: 500 })

    expect(result.page).toBe(1)
    expect(result.pageSize).toBe(50)
    expect(result.items).toHaveLength(1)
  })

  it('禁止管理员停用自己', async () => {
    const users = repository([{ id: 1, role: 'ADMIN', status: 1 }])
    const service = new IdentityService(users as any, repository() as any, jwt as any, config as any, {} as any)

    await expect(service.updateUserStatus('1', 0, '1')).rejects.toBeInstanceOf(ConflictException)
  })

  it('禁止停用最后一个有效管理员', async () => {
    const users = repository([{ id: 1, role: 'ADMIN', status: 1 }])
    const service = new IdentityService(users as any, repository() as any, jwt as any, config as any, {} as any)

    await expect(service.updateUserStatus('1', 0, '2')).rejects.toBeInstanceOf(ConflictException)
  })
})
