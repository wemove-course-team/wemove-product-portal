import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany
} from 'typeorm'
import { Article } from './article.entity'

@Entity('article_category')
export class ArticleCategory {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({ type: 'varchar', length: 64, nullable: false })
  name: string

  @Column({ type: 'varchar', length: 64, nullable: false, unique: true })
  slug: string

  @Column({ name: 'sort_order', type: 'int', nullable: false, default: 0 })
  sortOrder: number

  @OneToMany(() => Article, (article) => article.category)
  articles: Article[]
}
