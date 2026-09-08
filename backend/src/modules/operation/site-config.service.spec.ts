import { BadRequestException, NotFoundException } from '@nestjs/common'
import { SiteConfigService, SITE_CONFIG_KEYS } from './site-config.service'

/** 构造内存版 SiteConfig 仓库 Mock。 */
function createRepoMock(initial: Record<string, string> = {}) {
  const store = new Map<string, { configKey: string; configValue: string }>()
  for (const [k, v] of Object.entries(initial)) {
    store.set(k, { configKey: k, configValue: v })
  }
  return {
    store,
    find: jest.fn(async () => Array.from(store.values())),
    save: jest.fn(async (entity: { configKey: string; configValue: string }) => {
      store.set(entity.configKey, { ...entity })
      return entity
    })
  }
}

describe('SiteConfigService（单元）', () => {
  it('白名单包含且仅包含 7 个冻结配置键', () => {
    expect([...SITE_CONFIG_KEYS].sort()).toEqual(
      ['address', 'contactEmail', 'contactPhone', 'footerText', 'icpNo', 'logoUrl', 'siteName'].sort()
    )
  })

  it('getPublicConfig：缺失的键以空字符串补齐，返回全部白名单键', async () => {
    const repo = createRepoMock({ siteName: 'WEMOVE 惟木匠心' })
    const service = new SiteConfigService(repo as any)

    const config = await service.getPublicConfig()

    expect(config.siteName).toBe('WEMOVE 惟木匠心')
    expect(Object.keys(config).sort()).toEqual([...SITE_CONFIG_KEYS].sort())
    expect(config.logoUrl).toBe('')
  })

  it('updateConfig：管理员更新白名单键后，公开配置能读取新值', async () => {
    const repo = createRepoMock()
    const service = new SiteConfigService(repo as any)

    await service.updateConfig({ siteName: '新站名', contactPhone: '13800000000' }, '1')

    const config = await service.getPublicConfig()
    expect(config.siteName).toBe('新站名')
    expect(config.contactPhone).toBe('13800000000')
  })

  it('updateConfig：非白名单键被拒绝并返回 400，且不做任何部分写入', async () => {
    const repo = createRepoMock({ siteName: '旧站名' })
    const service = new SiteConfigService(repo as any)

    await expect(
      service.updateConfig({ siteName: '合法值', evilKey: 'hack' }, '1')
    ).rejects.toMatchObject({
      status: 400,
      response: expect.objectContaining({
        errors: expect.arrayContaining([expect.objectContaining({ field: 'evilKey' })])
      })
    })
    // 整体拒绝：合法键也不得被写入
    expect(repo.save).not.toHaveBeenCalled()
    expect((await service.getPublicConfig()).siteName).toBe('旧站名')
  })

  it('updateConfig：非法 URL（javascript: 伪协议）被拒绝', async () => {
    const repo = createRepoMock()
    const service = new SiteConfigService(repo as any)

    await expect(
      service.updateConfig({ logoUrl: 'javascript:alert(1)' }, '1')
    ).rejects.toThrow(BadRequestException)
  })

  it('updateConfig：合法 URL 接受相对路径与 https 外链', async () => {
    const repo = createRepoMock()
    const service = new SiteConfigService(repo as any)

    await expect(
      service.updateConfig({ logoUrl: '/images/prod_20_1.jpg' }, '1')
    ).resolves.toBeDefined()
    await expect(
      service.updateConfig({ logoUrl: 'https://example.com/logo.png' }, '1')
    ).resolves.toBeDefined()
  })

  it('updateConfig：空对象不报错，返回当前配置', async () => {
    const repo = createRepoMock({ siteName: '旧站名' })
    const service = new SiteConfigService(repo as any)

    const config = await service.updateConfig({}, '1')
    expect(config.siteName).toBe('旧站名')
  })
})
