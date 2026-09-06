import { Column, Entity, ManyToOne, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, JoinColumn } from 'typeorm'
import { ProductCategory } from './category.entity'

/** DECIMAL 列在 mysql2 驱动里是字符串，统一转成 number */
export const decimalTransformer = {
  to(value?: number | null): string | null {
    return value == null ? null : String(value)
  },
  from(value?: string | null): number | null {
    return value == null ? null : Number(value)
  }
}

/**
 * 商品主数据（对应 init SQL 基线表 `product`，增量迁移见 backend/sql/migrations）。
 * images/specs 以 simple-json 映射 images_json/specs_json（决策 D10：不做上传，存 /images/* 路径）。
 */
@Entity('product')
export class Product {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ name: 'sku', type: 'varchar', length: 64 })
  sku: string

  @Column({ name: 'name', type: 'varchar', length: 128 })
  name: string

  @Column({ name: 'slug', type: 'varchar', length: 128 })
  slug: string

  @Column({ name: 'category_id', type: 'bigint' })
  categoryId: string

  @ManyToOne(() => ProductCategory, { nullable: false })
  @JoinColumn({ name: 'category_id' })
  category: ProductCategory

  @Column({
    name: 'price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer
  })
  price: number

  @Column({
    name: 'dealer_price',
    type: 'decimal',
    precision: 10,
    scale: 2,
    transformer: decimalTransformer
  })
  dealerPrice: number

  @Column({ name: 'moq', type: 'int', default: 10 })
  moq: number

  @Column({ name: 'age_range', type: 'varchar', length: 64, nullable: true })
  ageRange: string | null

  @Column({ name: 'material', type: 'varchar', length: 128, nullable: true })
  material: string | null

  @Column({ name: 'scene', type: 'varchar', length: 255, nullable: true })
  scene: string | null

  @Column({ name: 'summary', type: 'varchar', length: 500, nullable: true })
  summary: string | null

  @Column({ name: 'description', type: 'text', nullable: true })
  description: string | null

  @Column({ name: 'images_json', type: 'simple-json', nullable: true })
  images: string[] | null

  @Column({ name: 'specs_json', type: 'simple-json', nullable: true })
  specs: Record<string, unknown> | null

  @Column({ name: 'is_published', type: 'tinyint', width: 1, default: 1 })
  isPublished: number

  @Column({ name: 'is_featured', type: 'tinyint', width: 1, default: 0 })
  isFeatured: number

  @Column({ name: 'tag', type: 'varchar', length: 32, nullable: true })
  tag: string | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
