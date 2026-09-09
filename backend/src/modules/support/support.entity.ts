import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'

export enum MessageStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  DONE = 'DONE'
}

export enum FaqStatus {
  PUBLISHED = 'PUBLISHED',
  DRAFT = 'DRAFT'
}

export enum DownloadVisibility {
  PUBLIC = 'PUBLIC',
  USER = 'USER',
  DEALER = 'DEALER'
}

/** 联系留言，对应 contact_message 表。 */
@Entity({ name: 'contact_message' })
export class SupportMessage {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number

  @Index({ unique: true })
  @Column({ length: 32 })
  code!: string

  @Column({ length: 64 })
  name!: string

  @Index()
  @Column({ length: 128 })
  email!: string

  @Column({ type: 'varchar', length: 32, nullable: true })
  phone!: string | null

  @Column({ length: 128 })
  subject!: string

  @Column({ type: 'text' })
  content!: string

  @Column({ type: 'varchar', length: 32, default: MessageStatus.PENDING })
  status!: MessageStatus

  @Column({ name: 'handle_note', type: 'varchar', length: 255, nullable: true })
  handleNote!: string | null

  @Column({ name: 'handled_by', type: 'bigint', nullable: true })
  handledBy!: number | null

  @Column({ name: 'handled_at', type: 'datetime', nullable: true })
  handledAt!: Date | null

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date
}

/** 常见问题，公开页只返回 PUBLISHED 记录。 */
@Entity({ name: 'faq' })
export class SupportFaq {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number

  @Column({ length: 255 })
  question!: string

  @Column({ type: 'text' })
  answer!: string

  @Index()
  @Column({ type: 'varchar', length: 64, nullable: true })
  category!: string | null

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number

  @Column({ type: 'varchar', length: 32, default: FaqStatus.PUBLISHED })
  status!: FaqStatus

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date
}

/** 不做上传，fileUrl 只引用 public 目录资源或外链。 */
@Entity({ name: 'download_resource' })
export class SupportDownload {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id!: number

  @Column({ length: 128 })
  title!: string

  @Column({ length: 64, default: 'manual' })
  category!: string

  @Column({ type: 'varchar', length: 255, nullable: true })
  description!: string | null

  @Column({ name: 'file_url', length: 255 })
  fileUrl!: string

  @Column({ name: 'cover_image', type: 'varchar', length: 255, nullable: true })
  coverImage!: string | null

  @Column({ type: 'varchar', length: 32, default: DownloadVisibility.PUBLIC })
  visibility!: DownloadVisibility

  @Column({ name: 'sort_order', type: 'int', default: 0 })
  sortOrder!: number

  @Column({ type: 'varchar', length: 32, default: FaqStatus.PUBLISHED })
  status!: FaqStatus

  @Column({ name: 'download_count', type: 'int', default: 0 })
  downloadCount!: number

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt!: Date
}
