import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException
} from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Like } from 'typeorm'
import { Article, ArticleStatus } from './entities/article.entity'
import { ArticleCategory } from './entities/article-category.entity'
import { Page } from './entities/page.entity'
import { CreateArticleDto } from './dto/create-article.dto'
import { UpdateArticleDto } from './dto/update-article.dto'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'
import { UpdatePageDto } from './dto/update-page.dto'
import { ArticleListItemDto } from './dto/article-list-item.dto'
import { PageResponseDto } from './dto/page-response.dto'
import { ArticleQueryDto, AdminArticleQueryDto } from './dto/article-query.dto'
import { sanitizeHtml } from './utils/html-sanitizer'

@Injectable()
export class ContentService {
  constructor(
    @InjectRepository(Article)
    private readonly articleRepo: Repository<Article>,
    @InjectRepository(ArticleCategory)
    private readonly categoryRepo: Repository<ArticleCategory>,
    @InjectRepository(Page)
    private readonly pageRepo: Repository<Page>
  ) {}

  // ============================== 公开接口 ==============================

  /** 获取栏目单页内容（仅已发布状态） */
  async findPageBySlug(slug: string): Promise<PageResponseDto> {
    const page = await this.pageRepo.findOne({
      where: { slug, status: 'PUBLISHED' }
    })
    if (!page) {
      throw new NotFoundException(`栏目单页 "${slug}" 不存在或未发布`)
    }
    let sections: any[] = []
    if (page.sectionsJson) {
      try {
        sections = JSON.parse(page.sectionsJson)
      } catch {
        sections = []
      }
    }
    return {
      slug: page.slug,
      title: page.title,
      sections,
      status: page.status,
      updatedAt: page.updatedAt
    }
  }

  /** 获取公开文章列表（仅已发布，支持分页、分类与关键词检索） */
  async findArticles(params: ArticleQueryDto): Promise<{
    items: ArticleListItemDto[]
    total: number
    page: number
    pageSize: number
  }> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10))
    const skip = (page - 1) * pageSize

    const where: any = { status: 'PUBLISHED' as ArticleStatus }
    if (params.categoryId) {
      where.categoryId = String(params.categoryId)
    }
    if (params.keyword) {
      where.title = Like(`%${params.keyword.trim()}%`)
    }

    const [articles, total] = await this.articleRepo.findAndCount({
      where,
      relations: ['category'],
      order: { publishedAt: 'DESC', createdAt: 'DESC' },
      skip,
      take: pageSize
    })

    const items: ArticleListItemDto[] = articles.map((a) => ({
      id: a.id,
      title: a.title,
      slug: a.slug,
      categoryName: a.category?.name ?? null,
      coverImage: a.coverImage,
      summary: a.summary,
      publishedAt: a.publishedAt
    }))

    return { items, total, page, pageSize }
  }

  /** 获取公开文章详情（仅已发布） */
  async findArticleBySlug(slug: string): Promise<Article> {
    const article = await this.articleRepo.findOne({
      where: { slug, status: 'PUBLISHED' as ArticleStatus },
      relations: ['category']
    })
    if (!article) {
      throw new NotFoundException(`文章 "${slug}" 不存在或已下架`)
    }
    return article
  }

  /** 获取公开文章分类列表（按 sortOrder 升序排列） */
  async findAllCategories(): Promise<ArticleCategory[]> {
    return this.categoryRepo.find({ order: { sortOrder: 'ASC' } })
  }

  // ============================== 管理接口 ==============================

  /** 管理端文章列表（支持状态、分类与关键词过滤） */
  async adminFindArticles(params: AdminArticleQueryDto): Promise<{
    items: Article[]
    total: number
    page: number
    pageSize: number
  }> {
    const page = Math.max(1, params.page ?? 1)
    const pageSize = Math.min(50, Math.max(1, params.pageSize ?? 10))
    const skip = (page - 1) * pageSize

    const where: any = {}
    if (params.categoryId) where.categoryId = String(params.categoryId)
    if (params.status) where.status = params.status
    if (params.keyword) where.title = Like(`%${params.keyword.trim()}%`)

    const [items, total] = await this.articleRepo.findAndCount({
      where,
      relations: ['category'],
      order: { createdAt: 'DESC' },
      skip,
      take: pageSize
    })

    return { items, total, page, pageSize }
  }

  /** 管理端根据 ID 查询文章详情 */
  async adminFindArticleById(id: string): Promise<Article> {
    const article = await this.articleRepo.findOne({
      where: { id: String(id) },
      relations: ['category']
    })
    if (!article) {
      throw new NotFoundException(`文章 #${id} 不存在`)
    }
    return article
  }

  /** 管理端创建文章（校验 slug 唯一并清洗 HTML） */
  async adminCreateArticle(dto: CreateArticleDto): Promise<Article> {
    const exists = await this.articleRepo.findOne({
      where: { slug: dto.slug }
    })
    if (exists) {
      throw new ConflictException(`Slug "${dto.slug}" 已存在`)
    }

    const article = this.articleRepo.create({
      ...dto,
      content: sanitizeHtml(dto.content),
      publishedAt: dto.status === 'PUBLISHED' ? new Date() : null
    })
    return this.articleRepo.save(article)
  }

  /** 管理端更新文章 */
  async adminUpdateArticle(id: string, dto: UpdateArticleDto): Promise<Article> {
    const article = await this.adminFindArticleById(id)

    if (dto.slug && dto.slug !== article.slug) {
      const exists = await this.articleRepo.findOne({
        where: { slug: dto.slug }
      })
      if (exists) {
        throw new ConflictException(`Slug "${dto.slug}" 已存在`)
      }
    }

    const updateData: any = { ...dto }
    if (dto.content !== undefined) {
      updateData.content = sanitizeHtml(dto.content)
    }

    // 状态变更为 PUBLISHED 时自动记录发布时间
    if (dto.status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date()
    }

    await this.articleRepo.update(String(id), updateData)
    return this.adminFindArticleById(id)
  }

  /** 管理端快捷切换文章状态 */
  async adminUpdateArticleStatus(id: string, status: ArticleStatus): Promise<Article> {
    const article = await this.adminFindArticleById(id)
    const updateData: any = { status }
    if (status === 'PUBLISHED' && article.status !== 'PUBLISHED') {
      updateData.publishedAt = new Date()
    }
    await this.articleRepo.update(String(id), updateData)
    return this.adminFindArticleById(id)
  }

  /** 管理端删除文章 */
  async adminDeleteArticle(id: string): Promise<void> {
    const result = await this.articleRepo.delete(String(id))
    if (result.affected === 0) {
      throw new NotFoundException(`文章 #${id} 不存在`)
    }
  }

  // --- 分类管理 ---

  async adminFindCategoryById(id: string): Promise<ArticleCategory> {
    const category = await this.categoryRepo.findOne({ where: { id: String(id) } })
    if (!category) {
      throw new NotFoundException(`分类 #${id} 不存在`)
    }
    return category
  }

  async adminCreateCategory(dto: CreateCategoryDto): Promise<ArticleCategory> {
    const exists = await this.categoryRepo.findOne({ where: { slug: dto.slug } })
    if (exists) {
      throw new ConflictException(`分类 Slug "${dto.slug}" 已存在`)
    }
    const category = this.categoryRepo.create(dto)
    return this.categoryRepo.save(category)
  }

  async adminUpdateCategory(id: string, dto: UpdateCategoryDto): Promise<ArticleCategory> {
    const category = await this.adminFindCategoryById(id)
    if (dto.slug && dto.slug !== category.slug) {
      const exists = await this.categoryRepo.findOne({ where: { slug: dto.slug } })
      if (exists) {
        throw new ConflictException(`分类 Slug "${dto.slug}" 已存在`)
      }
    }
    await this.categoryRepo.update(String(id), dto)
    return this.adminFindCategoryById(id)
  }

  async adminDeleteCategory(id: string): Promise<void> {
    // 检查是否有文章使用该分类
    const articleCount = await this.articleRepo.count({
      where: { categoryId: String(id) }
    })
    if (articleCount > 0) {
      throw new BadRequestException('该分类下仍有关联文章，无法删除')
    }

    const result = await this.categoryRepo.delete(String(id))
    if (result.affected === 0) {
      throw new NotFoundException(`分类 #${id} 不存在`)
    }
  }

  // --- 页面管理 ---

  async adminFindAllPages(): Promise<Page[]> {
    return this.pageRepo.find({ order: { id: 'ASC' } })
  }

  async adminFindPageById(id: string): Promise<Page> {
    const page = await this.pageRepo.findOne({ where: { id: String(id) } })
    if (!page) {
      throw new NotFoundException(`页面 #${id} 不存在`)
    }
    return page
  }

  async adminUpdatePage(id: string, dto: UpdatePageDto): Promise<Page> {
    await this.adminFindPageById(id)
    const updateData: any = { ...dto }
    if (dto.sectionsJson !== undefined) {
      try {
        JSON.parse(dto.sectionsJson)
      } catch {
        throw new BadRequestException('sectionsJson 必须为有效 JSON 格式')
      }
    }
    await this.pageRepo.update(String(id), updateData)
    return this.adminFindPageById(id)
  }
}
