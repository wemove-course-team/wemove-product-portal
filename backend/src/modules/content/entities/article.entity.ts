import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn
} from 'typeorm'
import { ArticleCategory } from './article-category.entity'

export type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'OFFLINE'

@Entity('article')
@Index('idx_category_status', ['categoryId', 'status'])
export class Article {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ type: 'varchar', length: 128, nullable: false })
  title: string

  @Column({ type: 'varchar', length: 128, nullable: false, unique: true })
  slug: string

  @Column({ name: 'category_id', type: 'bigint', nullable: true })
  categoryId: string | null

  @Column({ name: 'cover_image', type: 'varchar', length: 255, nullable: true })
  coverImage: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  summary: string | null

  @Column({ type: 'text', nullable: true })
  content: string | null

  @Column({
    type: 'varchar',
    length: 16,
    nullable: false,
    default: 'DRAFT',
    comment: 'DRAFT/PUBLISHED/OFFLINE'
  })
  status: ArticleStatus

  @Column({ name: 'published_at', type: 'datetime', nullable: true })
  publishedAt: Date | null

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date

  @ManyToOne(() => ArticleCategory, (category) => category.articles, {
    onDelete: 'SET NULL'
  })
  @JoinColumn({ name: 'category_id' })
  category: ArticleCategory | null
}
