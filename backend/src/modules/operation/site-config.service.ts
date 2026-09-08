import { Injectable, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { SiteConfig } from './site-config.entity'
import { isValidUrlOrPath } from './url-validator'

/** 对外冻结的站点配置白名单键（camelCase，即存储键）。 */
export const SITE_CONFIG_KEYS = [
  'siteName',
  'logoUrl',
  'contactPhone',
  'contactEmail',
  'address',
  'footerText',
  'icpNo'
] as const

export type SiteConfigKey = (typeof SITE_CONFIG_KEYS)[number]

/** 值必须是相对路径或 http(s) URL 的键。 */
const URL_KEYS: readonly string[] = ['logoUrl']

export type PublicSiteConfig = Record<SiteConfigKey, string>

@Injectable()
export class SiteConfigService {
  constructor(
    @InjectRepository(SiteConfig)
    private readonly repo: Repository<SiteConfig>
  ) {}

  /** 公开读取：始终返回全部白名单键，未设置的键为空字符串。 */
  async getPublicConfig(): Promise<PublicSiteConfig> {
    const rows = await this.repo.find()
    const stored = new Map(rows.map((row) => [row.configKey, row.configValue]))
    const config = {} as PublicSiteConfig
    for (const key of SITE_CONFIG_KEYS) {
      config[key] = stored.get(key) ?? ''
    }
    return config
  }

  /**
   * 管理端更新：只接受白名单键；未知键、非字符串、超长、非法 URL 均返回
   * 契约错误 VALIDATION_400（含 errors:[{field,message}]），且不做任何部分写入。
   */
  async updateConfig(
    input: Record<string, unknown>,
    updatedBy: string
  ): Promise<PublicSiteConfig> {
    const errors: { field: string; message: string }[] = []
    const entries = Object.entries(input ?? {})

    for (const [key, value] of entries) {
      if (!(SITE_CONFIG_KEYS as readonly string[]).includes(key)) {
        errors.push({ field: key, message: '未知的配置键，仅允许白名单键' })
        continue
      }
      if (typeof value !== 'string') {
        errors.push({ field: key, message: '配置值必须为字符串' })
        continue
      }
      if (value.length > 255) {
        errors.push({ field: key, message: '配置值长度不能超过 255 个字符' })
        continue
      }
      if (URL_KEYS.includes(key) && !isValidUrlOrPath(value)) {
        errors.push({ field: key, message: '必须是相对路径或 http(s) URL' })
      }
    }

    if (errors.length > 0) {
      throw new BadRequestException({
        code: 'VALIDATION_400',
        message: '请检查输入内容',
        errors
      })
    }

    await this.repo.manager.transaction(async (manager) => {
      for (const [key, value] of entries) {
        await manager.save(SiteConfig, {
          configKey: key,
          configValue: value as string,
          updatedBy: updatedBy ? Number(updatedBy) : null,
          updatedAt: new Date()
        })
      }
    })

    return this.getPublicConfig()
  }
}
