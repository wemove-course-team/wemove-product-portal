import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { createHash } from 'crypto'
import { RequestUser } from '../../common/request-user'
import { DownloadVisibility, FaqStatus, MessageStatus, SupportDownload, SupportFaq, SupportMessage } from './support.entity'
import { CreateDownloadDto, CreateFaqDto, CreateMessageDto, MessageQueryDto, UpdateDownloadDto, UpdateFaqDto, UpdateMessageStatusDto } from './support.dto'

/** 支持中心的留言、FAQ 和下载资源业务。 */
@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportMessage) private readonly messages: Repository<SupportMessage>,
    @InjectRepository(SupportFaq) private readonly faqs: Repository<SupportFaq>,
    @InjectRepository(SupportDownload) private readonly downloads: Repository<SupportDownload>,
    private readonly dataSource: DataSource
  ) {}

  async createMessage(input: CreateMessageDto) {
    const email = input.email.trim().toLowerCase()
    const subject = input.subject.trim()
    const dedupeKey = createHash('sha256').update(`${email}\n${subject}`).digest('hex')
    const now = new Date()
    return this.dataSource.transaction(async (manager) => {
      // MySQL named lock 将同一邮箱和主题的检查、写入串行化，避免并发双提交。
      const lockKey = `support:${email}:${subject}`.slice(0, 64)
      const lockRows = await manager.query('SELECT GET_LOCK(?, 10) AS acquired', [lockKey])
      if (Number(lockRows[0]?.acquired) !== 1) throw new ConflictException({ code: 'CONFLICT_409', message: '留言正在处理中，请稍后重试' })
      try {
        const recent = await manager.getRepository(SupportMessage).createQueryBuilder('message')
          .where('message.email = :email', { email })
          .andWhere('message.subject = :subject', { subject })
          .andWhere('message.createdAt >= :since', { since: new Date(now.getTime() - 60_000) })
          .getOne()
        if (recent) throw new BadRequestException({ code: 'VALIDATION_400', message: '相同主题的留言请勿重复提交，请稍后再试' })
      const repo = manager.getRepository(SupportMessage)
      const day = now.toISOString().slice(0, 10).replaceAll('-', '')
      const prefix = `MSG-${day}-`
      const latest = await repo.createQueryBuilder('message')
        .where('message.code LIKE :prefix', { prefix: `${prefix}%` })
        .orderBy('message.id', 'DESC')
        .setLock('pessimistic_write')
        .getOne()
      const previous = latest ? Number(latest.code.slice(-4)) : 0
      const message = repo.create({
        code: `${prefix}${String(previous + 1).padStart(4, '0')}`,
        dedupeKey,
        name: input.name.trim(), email, phone: input.phone?.trim() || null,
        subject, content: input.content.trim(), status: MessageStatus.PENDING,
        handleNote: null, handledBy: null, handledAt: null
      })
        try {
          return this.messageSummary(await repo.save(message))
        } catch (error) {
          if ((error as { code?: string })?.code === 'ER_DUP_ENTRY') {
            throw new BadRequestException({ code: 'VALIDATION_400', message: '相同主题的留言请勿重复提交，请稍后再试' })
          }
          throw error
        }
      } finally {
        await manager.query('SELECT RELEASE_LOCK(?)', [lockKey])
      }
    })
  }

  async listMessages(query: MessageQueryDto) {
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 10))
    const builder = this.messages.createQueryBuilder('message').orderBy('message.createdAt', 'DESC')
    if (query.status) builder.andWhere('message.status = :status', { status: query.status })
    if (query.keyword) builder.andWhere('(message.code LIKE :keyword OR message.name LIKE :keyword OR message.email LIKE :keyword OR message.subject LIKE :keyword)', { keyword: `%${query.keyword.trim()}%` })
    const [items, total] = await builder.skip((page - 1) * pageSize).take(pageSize).getManyAndCount()
    return { items: items.map((item) => this.messageSummary(item, true)), total, page, pageSize }
  }

  async getMessage(id: number) {
    const item = await this.messages.findOne({ where: { id } })
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '留言不存在' })
    return this.messageSummary(item, true)
  }

  async updateMessageStatus(id: number, input: UpdateMessageStatusDto, actor: RequestUser) {
    const item = await this.messages.findOne({ where: { id } })
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '留言不存在' })
    const transitions: Record<MessageStatus, MessageStatus[]> = {
      [MessageStatus.PENDING]: [MessageStatus.PENDING, MessageStatus.PROCESSING],
      [MessageStatus.PROCESSING]: [MessageStatus.PROCESSING, MessageStatus.DONE],
      [MessageStatus.DONE]: [MessageStatus.DONE]
    }
    if (!transitions[item.status].includes(input.status)) throw new ConflictException({ code: 'CONFLICT_409', message: '留言状态不能回退到该状态' })
    item.status = input.status
    item.handleNote = input.handleNote?.trim() || item.handleNote
    item.handledBy = Number(actor.id)
    item.handledAt = new Date()
    return this.messageSummary(await this.messages.save(item), true)
  }

  async listFaqs(keyword?: string, category?: string, includeDraft = false) {
    const builder = this.faqs.createQueryBuilder('faq').orderBy('faq.sortOrder', 'ASC').addOrderBy('faq.id', 'DESC')
    if (!includeDraft) builder.where('faq.status = :status', { status: FaqStatus.PUBLISHED })
    if (category) builder.andWhere('faq.category = :category', { category })
    if (keyword) builder.andWhere('(faq.question LIKE :keyword OR faq.answer LIKE :keyword)', { keyword: `%${keyword.trim()}%` })
    return builder.getMany()
  }

  async createFaq(input: CreateFaqDto) { return this.faqs.save(this.faqs.create({ ...input, category: input.category?.trim() || null })) }

  async updateFaq(id: number, input: UpdateFaqDto) {
    const item = await this.faqs.findOne({ where: { id } })
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND_404', message: 'FAQ 不存在' })
    Object.assign(item, input)
    if (input.category !== undefined) item.category = input.category?.trim() || null
    return this.faqs.save(item)
  }

  async deleteFaq(id: number) {
    const result = await this.faqs.delete(id)
    if (!result.affected) throw new NotFoundException({ code: 'NOT_FOUND_404', message: 'FAQ 不存在' })
  }

  async listDownloads(user: RequestUser | null, category?: string) {
    const allowed = this.allowedVisibility(user)
    const builder = this.downloads.createQueryBuilder('resource')
      .where('resource.status = :status', { status: FaqStatus.PUBLISHED })
      .andWhere('resource.visibility IN (:...allowed)', { allowed })
      .orderBy('resource.sortOrder', 'ASC').addOrderBy('resource.id', 'DESC')
    if (category) builder.andWhere('resource.category = :category', { category })
    return builder.getMany()
  }

  async getDownloadAccess(id: number, user: RequestUser | null) {
    const item = await this.downloads.findOne({ where: { id, status: FaqStatus.PUBLISHED } })
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '下载资源不存在' })
    if (!this.allowedVisibility(user).includes(item.visibility)) throw new ForbiddenException({ code: 'FORBIDDEN_403', message: '当前账号无权访问该下载资源' })
    await this.downloads.increment({ id }, 'downloadCount', 1)
    return { id: String(item.id), title: item.title, fileUrl: item.fileUrl }
  }

  async listAdminDownloads(category?: string) { return this.downloads.find({ where: category ? { category } : {}, order: { sortOrder: 'ASC', id: 'DESC' } }) }
  async createDownload(input: CreateDownloadDto) {
    this.assertResourceUrl(input.fileUrl)
    if (input.coverImage) this.assertResourceUrl(input.coverImage)
    return this.downloads.save(this.downloads.create({ ...input, fileUrl: input.fileUrl.trim(), coverImage: input.coverImage?.trim() || null }))
  }

  async updateDownload(id: number, input: UpdateDownloadDto) {
    const item = await this.downloads.findOne({ where: { id } })
    if (!item) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '下载资源不存在' })
    if (input.fileUrl) this.assertResourceUrl(input.fileUrl)
    if (input.coverImage) this.assertResourceUrl(input.coverImage)
    Object.assign(item, input)
    return this.downloads.save(item)
  }

  async deleteDownload(id: number) {
    const result = await this.downloads.delete(id)
    if (!result.affected) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '下载资源不存在' })
  }

  private allowedVisibility(user: RequestUser | null): DownloadVisibility[] {
    if (user?.role === 'ADMIN' || user?.role === 'DEALER') return [DownloadVisibility.PUBLIC, DownloadVisibility.USER, DownloadVisibility.DEALER]
    if (user) return [DownloadVisibility.PUBLIC, DownloadVisibility.USER]
    return [DownloadVisibility.PUBLIC]
  }

  private assertResourceUrl(value: string) {
    const url = value.trim()
    if (!/^(\/(?!\/)|https?:\/\/[^\s]+$)/i.test(url)) {
      throw new BadRequestException({ code: 'VALIDATION_400', message: '文件地址必须是站内路径或 http(s) 地址' })
    }
  }

  private messageSummary(item: SupportMessage, includeDetails = false) {
    return { id: String(item.id), code: item.code, name: item.name, email: item.email, phone: item.phone, subject: item.subject,
      ...(includeDetails ? { content: item.content } : {}), status: item.status, handleNote: item.handleNote,
      handledBy: item.handledBy == null ? null : String(item.handledBy), handledAt: item.handledAt, createdAt: item.createdAt }
  }
}
