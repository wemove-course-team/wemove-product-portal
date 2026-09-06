import { ConflictException, UnauthorizedException } from '@nestjs/common'
import { IdentityService } from './identity.service'

function repository(items: any[] = []) {
  return {
    items,
    findOne: jest.fn(async ({ where }: any) => {
      const clauses = Array.isArray(where) ? where : [where]
      return items.find((item) => clauses.some((clause) => Object.entries(clause).every(([key, value]: any) => {
        if (value && typeof value === 'object' && '_type' in value && value._type === 'isNull') return item[key] == null
        return item[key] === value
      }))) || null
    }),
    find: jest.fn(async () => items),
    create: jest.fn((value: any) => value),
    save: jest.fn(async (value: any) => { if (value.id == null) value.id = items.length + 1; const index = items.findIndex((item) => item.id === value.id); if (index >= 0) items[index] = value; else items.push(value); return value }),
    update: jest.fn(async () => undefined),
    createQueryBuilder: jest.fn(() => ({ select() { return this }, orderBy() { return this }, andWhere() { return this }, skip() { return this }, take() { return this }, getManyAndCount: async () => [items, items.length] }))
  }
}

describe('IdentityService', () => {
  const config = { get: jest.fn((_key: string, fallback: string) => fallback) }

  it('registers a USER with a bcrypt password hash', async () => {
    const users = repository(); const resets = repository(); const service = new IdentityService(users as any, resets as any, { signAsync: jest.fn() } as any, config as any)
    const user = await service.register({ username: 'demo_user', email: 'demo@example.com', password: '12345678' })
    expect(user.role).toBe('USER'); expect(user.email).toBe('demo@example.com'); expect(users.items[0].passwordHash).not.toBe('12345678')
  })

  it('rejects a duplicate username or email', async () => {
    const users = repository([{ id: 1, username: 'demo_user', email: 'demo@example.com' }]); const service = new IdentityService(users as any, repository() as any, {} as any, config as any)
    await expect(service.register({ username: 'demo_user', email: 'other@example.com', password: '12345678' })).rejects.toBeInstanceOf(ConflictException)
  })

  it('rejects invalid credentials and disabled users', async () => {
    const users = repository([{ id: 1, username: 'demo_user', email: 'demo@example.com', passwordHash: '$2b$10$invalid', status: 0 }]); const service = new IdentityService(users as any, repository() as any, {} as any, config as any)
    await expect(service.authenticate('demo_user', '12345678')).rejects.toBeInstanceOf(UnauthorizedException)
  })

  it('requires an active account when reading the current user', async () => {
    const users = repository([{ id: 1, status: 0 }]); const service = new IdentityService(users as any, repository() as any, {} as any, config as any)
    await expect(service.getById('1')).rejects.toMatchObject({ status: 401 })
  })

  it('limits user listing to safe pagination values', async () => {
    const users = repository([{ id: 1, username: 'a', email: 'a@example.com', status: 1 }]); const service = new IdentityService(users as any, repository() as any, {} as any, config as any)
    const result = await service.listUsers({ page: 0, pageSize: 500 })
    expect(result.page).toBe(1); expect(result.pageSize).toBe(50); expect(result.items).toHaveLength(1)
  })
})
