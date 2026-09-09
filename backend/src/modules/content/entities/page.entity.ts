import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  UpdateDateColumn
} from 'typeorm'

export type PageStatus = 'PUBLISHED' | 'DRAFT'

@Entity('page')
export class Page {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string

  @Column({
    type: 'varchar',
    length: 64,
    nullable: false,
    unique: true,
    comment: '对应前台栏目路由：furniture/woodlab/stem/library/charity/dream/electronic'
  })
  slug: string

  @Column({ type: 'varchar', length: 128, nullable: false })
  title: string

  @Column({
    name: 'sections_json',
    type: 'text',
    nullable: true,
    comment: '页面分块内容 JSON（结构沿用前端 pageSections.json）'
  })
  sectionsJson: string | null

  @Column({ type: 'varchar', length: 16, nullable: false, default: 'PUBLISHED' })
  status: PageStatus

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date
}
