import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm'

/**
 * 商品分类（对应 init SQL 基线表 `product_category`）。
 * slug 唯一索引由增量迁移 mvp03_catalog_incremental.sql 补充。
 */
@Entity('product_category')
export class ProductCategory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ name: 'name', type: 'varchar', length: 64 })
  name: string

  @Column({ name: 'slug', type: 'varchar', length: 64 })
  slug: string

  @Column({ name: 'description', type: 'varchar', length: 255, nullable: true })
  description: string | null

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder: number
}
