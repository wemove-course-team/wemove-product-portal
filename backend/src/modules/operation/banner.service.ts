import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, In } from 'typeorm'
import { Banner } from './banner.entity'
import { isValidUrlOrPath } from './url-validator'

export interface BannerItem {
  id: number
  title: string
  imageUrl: string
  linkUrl: string | null
  sortOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateBannerInput {
  title: string
  imageUrl: string
  linkUrl?: string | null
  sortOrder?: number
  isActive?: boolean
}

/** 编辑接口入参：不含 isActive，启停只能走 adminUpdateStatus。 */
export interface UpdateBannerInput {
  title?: string
  imageUrl?: string
  linkUrl?: string | null
  sortOrder?: number
}

const ACTIVE_TRUE = 1
const ACTIVE_FALSE = 0

@Injectable()
export class BannerService {
  constructor(
    @InjectRepository(Banner)
    private readonly repo: Repository<Banner>
  ) {}

  /** 公开列表：仅启用项，按 sortOrder、id 稳定排序。 */
  async listPublic(): Promise<BannerItem[]> {
    const rows = await this.repo.find({
      where: { isActive: ACTIVE_TRUE },
      order: { sortOrder: 'ASC', id: 'ASC' }
    })
    return rows.map((row) => this.toItem(row))
  }

  /** 管理列表：全部（含停用），同一稳定排序。 */
  async adminList(): Promise<BannerItem[]> {
    const rows = await this.repo.find({ order: { sortOrder: 'ASC', id: 'ASC' } })
    return rows.map((row) => this.toItem(row))
  }

  async adminCreate(input: CreateBannerInput): Promise<BannerItem> {
    this.validate(input.imageUrl, input.linkUrl ?? null, input.sortOrder)
    const saved = await this.repo.save(
      this.repo.create({
        title: input.title,
        imageUrl: input.imageUrl,
        linkUrl: input.linkUrl ?? null,
        sortOrder: input.sortOrder ?? 0,
        isActive: input.isActive === false ? ACTIVE_FALSE : ACTIVE_TRUE
      })
    )
    return this.toItem(saved)
  }

  async adminUpdate(id: number | string, input: UpdateBannerInput): Promise<BannerItem> {
    // 防御：即使调用方绕过 DTO，也拒绝通过编辑接口改启停（避免 200 但状态未变的假成功）。
    if (input !== null && typeof input === 'object' && 'isActive' in input) {
      throw new BadRequestException({
        code: 'VALIDATION_400',
        message: '请检查输入内容',
        errors: [{ field: 'isActive', message: '启停请使用 PUT /admin/banners/:id/status' }]
      })
    }
    const existing = await this.findExisting(id)
    const imageUrl = input.imageUrl ?? existing.imageUrl
    const linkUrl = input.linkUrl !== undefined ? input.linkUrl : existing.linkUrl
    const sortOrder = input.sortOrder ?? existing.sortOrder
    this.validate(imageUrl, linkUrl ?? null, sortOrder)

    const updateData: Partial<Banner> = { updatedAt: new Date() }
    if (input.title !== undefined) updateData.title = input.title
    if (input.imageUrl !== undefined) updateData.imageUrl = input.imageUrl
    if (input.linkUrl !== undefined) updateData.linkUrl = input.linkUrl
    if (input.sortOrder !== undefined) updateData.sortOrder = input.sortOrder

    await this.repo.update(String(existing.id), updateData)
    return this.toItem(await this.findExisting(id))
  }

  async adminUpdateStatus(id: number | string, isActive: boolean): Promise<BannerItem> {
    const existing = await this.findExisting(id)
    await this.repo.update(String(existing.id), {
      isActive: isActive ? ACTIVE_TRUE : ACTIVE_FALSE,
      updatedAt: new Date()
    })
    return this.toItem(await this.findExisting(id))
  }

  /** 批量排序：预检（404/400）后，在单事务内统一写入；任一更新失败/记录缺失即整体回滚。 */
  async adminSort(items: { id: number | string; sortOrder: number }[]): Promise<BannerItem[]> {
    if (!Array.isArray(items) || items.length === 0) {
      throw new BadRequestException('排序项不能为空')
    }
    for (const item of items) {
      if (!Number.isInteger(Number(item.id)) || !Number.isInteger(item.sortOrder) || item.sortOrder < 0) {
        throw new BadRequestException('排序值必须为不小于 0 的整数')
      }
    }
    const ids = items.map((item) => String(Number(item.id)))
    if (new Set(ids).size !== ids.length) {
      throw new BadRequestException({
        code: 'VALIDATION_400',
        message: '请检查输入内容',
        errors: [{ field: 'items', message: '同一个 Banner 不能重复排序' }]
      })
    }
    const found = await this.repo.find({ where: { id: In(ids) } })
    const foundIds = new Set(found.map((row) => String(row.id)))
    const missing = ids.filter((id) => !foundIds.has(id))
    if (missing.length > 0) {
      throw new NotFoundException(`Banner #${missing.join(', #')} 不存在`)
    }

    await this.repo.manager.transaction(async (manager) => {
      for (const item of items) {
        const result = await manager.update(Banner, String(Number(item.id)), {
          sortOrder: item.sortOrder,
          updatedAt: new Date()
        })
        // 并发删除等导致 affected=0：抛错以触发整体回滚，杜绝部分排序写入。
        if (!result || (result.affected ?? 0) === 0) {
          throw new NotFoundException(`Banner #${item.id} 不存在`)
        }
      }
    })
    return this.adminList()
  }

  async adminDelete(id: number | string): Promise<void> {
    const existing = await this.findExisting(id)
    const result = await this.repo.delete(String(existing.id))
    if (result.affected === 0) {
      throw new NotFoundException(`Banner #${existing.id} 不存在`)
    }
  }

  private async findExisting(id: number | string): Promise<Banner> {
    const numericId = Number(id)
    if (!Number.isInteger(numericId) || numericId <= 0) {
      throw new NotFoundException(`Banner #${id} 不存在`)
    }
    const row = await this.repo.findOne({ where: { id: numericId } })
    if (!row) {
      throw new NotFoundException(`Banner #${id} 不存在`)
    }
    return row
  }

  private validate(imageUrl: string | undefined, linkUrl: string | null, sortOrder: number | undefined): void {
    if (imageUrl !== undefined && !isValidUrlOrPath(imageUrl)) {
      throw new BadRequestException({
        code: 'VALIDATION_400',
        message: '请检查输入内容',
        errors: [{ field: 'imageUrl', message: '必须是相对路径或 http(s) URL' }]
      })
    }
    if (linkUrl != null && !isValidUrlOrPath(linkUrl)) {
      throw new BadRequestException({
        code: 'VALIDATION_400',
        message: '请检查输入内容',
        errors: [{ field: 'linkUrl', message: '必须是相对路径或 http(s) URL' }]
      })
    }
    if (sortOrder !== undefined && (!Number.isInteger(sortOrder) || sortOrder < 0)) {
      throw new BadRequestException({
        code: 'VALIDATION_400',
        message: '请检查输入内容',
        errors: [{ field: 'sortOrder', message: '排序值必须为不小于 0 的整数' }]
      })
    }
  }

  private toItem(row: Banner): BannerItem {
    return {
      id: Number(row.id),
      title: row.title,
      imageUrl: row.imageUrl,
      linkUrl: row.linkUrl,
      sortOrder: Number(row.sortOrder),
      isActive: Number(row.isActive) === ACTIVE_TRUE,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt
    }
  }
}
