import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Product } from './product.entity'
import { ProductCategory } from './category.entity'
import {
  AdminProductQueryDto,
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateProductStatusDto,
  sanitizeSlug
} from './dto/catalog.dto'
import { toAdminProduct, toCategory } from './catalog.mapper'

/**
 * 产品/分类管理服务（#87 MVP-03，ADMIN 权限由 SessionGuard + RolesGuard 裁决）
 *
 * 验收对应：
 * - SKU、slug 全局唯一（冲突返回 409 CONFLICT_409）
 * - 发布/下架走 PUT /admin/products/:id/status（草稿与下架不进入公开列表）
 * - 分类删除前校验产品引用（409），满足“停售产品不删除历史关联”的约束口径
 */
@Injectable()
export class CatalogAdminService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>
  ) {}

  async listProducts(query: AdminProductQueryDto) {
    const page = Math.max(1, Math.floor(query.page ?? 1))
    const pageSize = Math.min(50, Math.max(1, Math.floor(query.pageSize ?? 10)))

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')

    if (query.status === 'published') {
      qb.andWhere('p.isPublished = 1')
    } else if (query.status === 'draft') {
      qb.andWhere('p.isPublished = 0')
    }
    if (query.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId: String(query.categoryId) })
    }
    const keyword = query.keyword?.trim()
    if (keyword) {
      qb.andWhere('(p.name LIKE :kw OR p.sku LIKE :kw OR p.slug LIKE :kw)', {
        kw: `%${keyword}%`
      })
    }
    qb.orderBy('p.updatedAt', 'DESC').addOrderBy('p.id', 'ASC')
    qb.skip((page - 1) * pageSize).take(pageSize)

    const [items, total] = await qb.getManyAndCount()
    return { items: items.map(toAdminProduct), total, page, pageSize }
  }

  async getProduct(id: string) {
    const product = await this.findProductOrFail(id)
    return toAdminProduct(product)
  }

  async createProduct(dto: CreateProductDto) {
    const slug = sanitizeSlug(dto.slug || dto.sku)
    await this.assertSkuAvailable(dto.sku)
    await this.assertSlugAvailable(slug)
    await this.assertCategoryExists(dto.categoryId)

    const product = this.productRepo.create({
      sku: dto.sku,
      name: dto.name,
      slug,
      categoryId: String(dto.categoryId),
      price: dto.price,
      dealerPrice: dto.dealerPrice,
      moq: dto.moq ?? 10,
      ageRange: dto.ageRange ?? null,
      material: dto.material ?? null,
      scene: dto.scene ?? null,
      summary: dto.summary ?? null,
      description: dto.description ?? null,
      images: dto.images ?? [],
      specs: dto.specs ?? {},
      isPublished: dto.isPublished ?? 1,
      isFeatured: dto.isFeatured ?? 0,
      tag: dto.tag ?? null
    })
    const saved = await this.productRepo.save(product)
    return this.getProduct(String(saved.id))
  }

  async updateProduct(id: string, dto: UpdateProductDto) {
    const product = await this.findProductOrFail(id)

    if (dto.sku !== undefined && dto.sku !== product.sku) {
      await this.assertSkuAvailable(dto.sku)
    }
    if (dto.slug !== undefined && sanitizeSlug(dto.slug) !== product.slug) {
      await this.assertSlugAvailable(sanitizeSlug(dto.slug))
    }
    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId)
    }

    const patch: Partial<Product> = {}
    if (dto.sku !== undefined) patch.sku = dto.sku
    if (dto.name !== undefined) patch.name = dto.name
    if (dto.slug !== undefined) patch.slug = sanitizeSlug(dto.slug)
    if (dto.categoryId !== undefined) patch.categoryId = String(dto.categoryId)
    if (dto.price !== undefined) patch.price = dto.price
    if (dto.dealerPrice !== undefined) patch.dealerPrice = dto.dealerPrice
    if (dto.moq !== undefined) patch.moq = dto.moq
    if (dto.ageRange !== undefined) patch.ageRange = dto.ageRange
    if (dto.material !== undefined) patch.material = dto.material
    if (dto.scene !== undefined) patch.scene = dto.scene
    if (dto.summary !== undefined) patch.summary = dto.summary
    if (dto.description !== undefined) patch.description = dto.description
    if (dto.images !== undefined) patch.images = dto.images
    if (dto.specs !== undefined) patch.specs = dto.specs
    if (dto.isPublished !== undefined) patch.isPublished = dto.isPublished
    if (dto.isFeatured !== undefined) patch.isFeatured = dto.isFeatured
    if (dto.tag !== undefined) patch.tag = dto.tag

    // save 而非 update：JSON 列（images_json/specs_json）在 update 的深 Partial 类型下
    // 需要 as any 强转，save 直接接受完整实体，也让 @UpdateDateColumn 由 ORM 统一维护
    Object.assign(product, patch)
    await this.productRepo.save(product)
    return this.getProduct(product.id)
  }

  /** 发布/下架（含精选开关）：对应「后台产品发布、下架」交付项 */
  async updateProductStatus(id: string, dto: UpdateProductStatusDto) {
    const product = await this.findProductOrFail(id)
    product.isPublished = dto.isPublished
    if (dto.isFeatured !== undefined) {
      product.isFeatured = dto.isFeatured
    }
    await this.productRepo.save(product)
    return this.getProduct(product.id)
  }

  /**
   * 物理删除。注意：正式下架请使用 PUT /:id/status（需求 ADM-P-001：下架不物理删除），
   * 本接口供误建数据清理；历史订单明细冗余存储了 SKU/名称，不受删除影响。
   */
  async deleteProduct(id: string) {
    const product = await this.findProductOrFail(id)
    await this.productRepo.delete(product.id)
    return { id: String(product.id) }
  }

  // ------------------------------ 分类管理 ------------------------------

  async listCategoriesForAdmin() {
    const categories = await this.categoryRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' }
    })
    const counts = await this.productRepo
      .createQueryBuilder('p')
      .select('p.category_id', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.category_id')
      .getRawMany<{ categoryId: string; count: string }>()
    const countMap = new Map(counts.map((row) => [String(row.categoryId), Number(row.count)]))
    return categories.map((c) => toCategory(c, countMap.get(String(c.id)) ?? 0))
  }

  async createCategory(dto: CreateCategoryDto) {
    await this.assertCategorySlugAvailable(dto.slug)
    const category = this.categoryRepo.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description ?? null,
      sortOrder: dto.sortOrder ?? 0
    })
    const saved = await this.categoryRepo.save(category)
    return toCategory(saved, 0)
  }

  async updateCategory(id: string, dto: UpdateCategoryDto) {
    const category = await this.categoryRepo.findOne({ where: { id } })
    if (!category) {
      throw new NotFoundException('分类不存在')
    }
    if (dto.slug !== undefined && dto.slug !== category.slug) {
      await this.assertCategorySlugAvailable(dto.slug)
    }
    const patch: Partial<ProductCategory> = {}
    if (dto.name !== undefined) patch.name = dto.name
    if (dto.slug !== undefined) patch.slug = dto.slug
    if (dto.description !== undefined) patch.description = dto.description
    if (dto.sortOrder !== undefined) patch.sortOrder = dto.sortOrder
    await this.categoryRepo.update(category.id, patch)

    const updated = await this.categoryRepo.findOne({ where: { id: category.id } })
    return toCategory(updated ?? category, 0)
  }

  async deleteCategory(id: string) {
    const category = await this.categoryRepo.findOne({ where: { id } })
    if (!category) {
      throw new NotFoundException('分类不存在')
    }
    const count = await this.productRepo.count({ where: { categoryId: category.id } })
    if (count > 0) {
      throw new ConflictException(`分类「${category.name}」下仍有 ${count} 款产品，请先移转或删除产品`)
    }
    await this.categoryRepo.delete(category.id)
    return { id: String(category.id) }
  }

  // ------------------------------ 内部校验 ------------------------------

  private async findProductOrFail(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({
      where: { id },
      relations: { category: true }
    })
    if (!product) {
      throw new NotFoundException('产品不存在')
    }
    return product
  }

  private async assertSkuAvailable(sku: string) {
    const exists = await this.productRepo.findOne({ where: { sku } })
    if (exists) {
      throw new ConflictException(`SKU ${sku} 已存在`)
    }
  }

  private async assertSlugAvailable(slug: string) {
    const exists = await this.productRepo.findOne({ where: { slug } })
    if (exists) {
      throw new ConflictException(`产品标识 slug “${slug}” 已存在`)
    }
  }

  private async assertCategorySlugAvailable(slug: string) {
    const exists = await this.categoryRepo.findOne({ where: { slug } })
    if (exists) {
      throw new ConflictException(`分类标识 slug “${slug}” 已存在`)
    }
  }

  private async assertCategoryExists(categoryId: number) {
    const exists = await this.categoryRepo.findOne({ where: { id: String(categoryId) } })
    if (!exists) {
      throw new BadRequestException({
        code: 'VALIDATION_400',
        message: '请检查输入内容',
        errors: [{ field: 'categoryId', message: '所选分类不存在' }]
      })
    }
  }
}
