import { Column, Entity } from 'typeorm'

/** 站点配置键值对。config_key 只允许 operation 白名单内的键。 */
@Entity({ name: 'site_config' })
export class SiteConfig {
  @Column({ name: 'config_key', type: 'varchar', length: 64, primary: true })
  configKey!: string

  @Column({ name: 'config_value', type: 'varchar', length: 255, default: '' })
  configValue!: string

  @Column({ name: 'updated_by', type: 'bigint', nullable: true })
  updatedBy!: number | null

  @Column({ name: 'updated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt!: Date
}
