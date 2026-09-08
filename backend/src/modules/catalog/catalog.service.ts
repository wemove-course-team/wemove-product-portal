import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Product } from './product.entity'
import { ProductCategory } from './category.entity'
import { ProductQueryDto } from './dto/catalog.dto'
import { toDetail, toListItem, toCategory, ViewerRole } from './catalog.mapper'

/**
 * 产品目录公开服务（#87 MVP-03）
 *
 * 契约（#87 issue 评论冻结稿）：
 * - GET /products?page&pageSize&keyword&categoryId&featured（附加 age/sort 供列表页筛选）
 * - GET /products/:slug（草稿与下架产品一律 404；纯数字 key 兼容旧 /product/:id 外链）
 * - GET /categories（productCount 只统计已发布产品）
 */
@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
    @InjectRepository(ProductCategory)
    private readonly categoryRepo: Repository<ProductCategory>
  ) {}

  /** 公开产品列表：仅已发布产品；keyword 命中名称/SKU/卖点/场景/标签（SEA-004 权重 MVP 版） */
  async listProducts(query: ProductQueryDto) {
    const page = Math.max(1, Math.floor(query.page ?? 1))
    const pageSize = Math.min(50, Math.max(1, Math.floor(query.pageSize ?? 10)))

    const qb = this.productRepo
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.category', 'c')
      .where('p.isPublished = 1')

    if (query.categoryId) {
      qb.andWhere('p.categoryId = :categoryId', { categoryId: String(query.categoryId) })
    }
    if (query.featured === '1') {
      qb.andWhere('p.isFeatured = 1')
    }
    const keyword = query.keyword?.trim()
    if (keyword) {
      qb.andWhere(
        '(p.name LIKE :kw OR p.sku LIKE :kw OR p.summary LIKE :kw OR p.scene LIKE :kw OR p.tag LIKE :kw)',
        { kw: `%${keyword}%` }
      )
    }
    this.applyAgeFilter(qb, query.age)

    // QueryBuilder 的 where/orderBy 统一走属性路径（isFeatured 等），
    // skip/take 分页下使用裸列名会让 TypeORM 组合排序表达式时崩溃
    switch (query.sort) {
      case 'price_asc':
        qb.orderBy('p.price', 'ASC')
        break
      case 'price_desc':
        qb.orderBy('p.price', 'DESC')
        break
      case 'newest':
        qb.orderBy('p.createdAt', 'DESC')
        break
      case 'name_asc':
        qb.orderBy('p.name', 'ASC')
        break
      default:
        // 默认推荐：精选优先，其余按上架时间稳定排序
        qb.orderBy('p.isFeatured', 'DESC').addOrderBy('p.createdAt', 'ASC')
        break
    }
    qb.addOrderBy('p.id', 'ASC')
    qb.skip((page - 1) * pageSize).take(pageSize)

    const [items, total] = await qb.getManyAndCount()
    return { items: items.map((p) => toListItem(p)), total, page, pageSize }
  }

  /** 公开详情：slug 寻址；纯数字 key 先按 slug 再按 id 兼容旧外链（/product/:id 重定向） */
  async getProductByKey(key: string, role: ViewerRole | null | undefined) {
    const base = () =>
      this.productRepo
        .createQueryBuilder('p')
        .leftJoinAndSelect('p.category', 'c')
        .where('p.isPublished = 1')

    let product = await base().andWhere('p.slug = :key', { key }).getOne()
    if (!product && /^\d+$/.test(key)) {
      product = await base().andWhere('p.id = :key', { key }).getOne()
    }
    if (!product) {
      throw new NotFoundException('产品不存在或已下架')
    }
    return toDetail(product, role)
  }

  /** 公开分类列表（含每个分类已发布产品数，供导航与列表页使用） */
  async listCategories() {
    const categories = await this.categoryRepo.find({
      order: { sortOrder: 'ASC', id: 'ASC' }
    })
    const counts = await this.productRepo
      .createQueryBuilder('p')
      .select('p.category_id', 'categoryId')
      .addSelect('COUNT(*)', 'count')
      .where('p.is_published = 1')
      .groupBy('p.category_id')
      .getRawMany<{ categoryId: string; count: string }>()
    const countMap = new Map(counts.map((row) => [String(row.categoryId), Number(row.count)]))
    return categories.map((c) => toCategory(c, countMap.get(String(c.id)) ?? 0))
  }

  /** 年龄段过滤：与前台既有筛选器的 ageRange 启发式一致（3-6 / 6-10 / 10-plus） */
  private applyAgeFilter(
    qb: ReturnType<Repository<Product>['createQueryBuilder']>,
    age?: '3-6' | '6-10' | '10-plus'
  ) {
    if (age === '3-6') {
      qb.andWhere('(p.ageRange LIKE :a1 OR p.ageRange LIKE :a2)', { a1: '%3%', a2: '%4%' })
    } else if (age === '6-10') {
      qb.andWhere('(p.ageRange LIKE :a1 OR p.ageRange LIKE :a2 OR p.ageRange LIKE :a3)', {
        a1: '%6%',
        a2: '%8%',
        a3: '%10%'
      })
    } else if (age === '10-plus') {
      qb.andWhere('(p.ageRange LIKE :a1 OR p.ageRange LIKE :a2 OR p.ageRange LIKE :a3)', {
        a1: '%12%',
        a2: '%14%',
        a3: '%及以上%'
      })
    }
  }
}
