import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/** 首页横幅。图片与链接只允许相对路径或 http(s) URL（决策 D10：不做文件上传）。 */
@Entity({ name: 'banner' })
export class Banner {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number

  @Column({ length: 128 })
  title!: string

  @Column({ name: 'image_url', type: 'varchar', length: 255 })
  imageUrl!: string

  @Column({ name: 'link_url', type: 'varchar', length: 255, nullable: true })
  linkUrl!: string | null

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number

  @Column({ name: 'is_active', type: 'tinyint', width: 1, default: 1 })
  isActive!: number | boolean

  @Column({ name: 'created_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date

  @Column({ name: 'updated_at', type: 'datetime', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date
}
