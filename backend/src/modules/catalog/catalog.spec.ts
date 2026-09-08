import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { CatalogService } from './catalog.service'
import { CatalogAdminService } from './catalog-admin.service'
import { canSeeDealerPrice, toCategory, toDetail, toListItem } from './catalog.mapper'
import type { Product } from './product.entity'
import type { ProductCategory } from './category.entity'

/**
 * 产品域单元测试（#87 MVP-03）。
 * 覆盖验收点：公开列表仅已发布、分页上限 50、keyword 检索、角色裁剪
 * （GUEST/USER 永无 dealerPrice/moq）、SKU/slug 唯一（409）、
 * 草稿详情 404、分类删除引用校验。
 */

function makeCategory(overrides: Partial<ProductCategory> = {}): ProductCategory {
  return {
    id: '1',
    name: '益智玩具',
    slug: 'workshop',
    description: '动手创造',
    sortOrder: 1,
    ...overrides
  } as ProductCategory
}

function makeProduct(overrides: Partial<Product> = {}): Product {
  return {
    id: '101',
    sku: 'WM-BWL-01',
    name: '儿童实木保龄球套装',
    slug: 'kids-bowling-set',
    categoryId: '1',
    category: makeCategory(),
    price: 198,
    dealerPrice: 118,
    moq: 10,
    ageRange: '3-10岁',
    material: '天然优质实木',
    scene: '室内亲子',
    summary: '经典运动玩具',
    description: '高品质实木打磨',
    images: ['/images/prod_20_1.jpg', '/images/prod_14_1.jpg'],
    specs: { dimensions: '18cm x 5.5cm', casePack: 12 },
    isPublished: 1,
    isFeatured: 1,
    tag: '热销爆款',
    createdAt: new Date('2026-09-01T00:00:00Z'),
    updatedAt: new Date('2026-09-02T00:00:00Z'),
    ...overrides
  } as Product
}

/** 链式 QueryBuilder mock：记录调用便于断言 SQL 片段 */
function createQueryBuilderMock() {
  const calls: Record<string, unknown[][]> = {}
  const qb: Record<string, unknown> = {}
  const chain = [
    'leftJoinAndSelect',
    'where',
    'andWhere',
    'orderBy',
    'addOrderBy',
    'skip',
    'take',
    'select',
    'addSelect',
    'groupBy'
  ]
  for (const method of chain) {
    calls[method] = []
    qb[method] = jest.fn((...args: unknown[]) => {
      calls[method].push(args)
      return qb
    })
  }
  return { qb, calls }
}

type RepoMock = Record<string, jest.Mock>

function buildServiceMocks(productRows: Product[]) {
  const publicQb = createQueryBuilderMock()
  publicQb.qb.getManyAndCount = jest.fn(async () => [productRows, productRows.length])
  publicQb.qb.getOne = jest.fn(async () => productRows[0] ?? null)
  publicQb.qb.getRawMany = jest.fn(async () => [{ categoryId: '1', count: '5' }])

  const productRepo: RepoMock = {
    createQueryBuilder: jest.fn(() => publicQb.qb),
    findOne: jest.fn(async () => null),
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => input),
    update: jest.fn(async () => undefined),
    delete: jest.fn(async () => undefined),
    count: jest.fn(async () => 0)
  }
  const categoryRepo: RepoMock = {
    find: jest.fn(async () => [makeCategory()]),
    findOne: jest.fn(async () => makeCategory()),
    create: jest.fn((input) => input),
    save: jest.fn(async (input) => input),
    update: jest.fn(async () => undefined),
    delete: jest.fn(async () => undefined)
  }

  const publicService = new CatalogService(
    productRepo as never,
    categoryRepo as never
  )
  const adminService = new CatalogAdminService(
    productRepo as never,
    categoryRepo as never
  )
  return { publicService, adminService, productRepo, categoryRepo, publicQb }
}

describe('catalog.mapper 角色裁剪（验收：公开接口不返回经销商私有价格）', () => {
  const product = makeProduct()

  it('游客/普通用户的详情 DTO 不包含 dealerPrice 与 moq', () => {
    for (const role of ['GUEST', 'USER', null, undefined] as const) {
      const detail = toDetail(product, role as never)
      expect(detail).not.toHaveProperty('dealerPrice')
      expect(detail).not.toHaveProperty('moq')
      expect(detail.price).toBe(198)
    }
    expect(canSeeDealerPrice('USER')).toBe(false)
  })

  it('DEALER/ADMIN 的详情 DTO 附加 dealerPrice 与 moq', () => {
    const detail = toDetail(product, 'DEALER')
    expect(detail.dealerPrice).toBe(118)
    expect(detail.moq).toBe(10)
    expect(canSeeDealerPrice('ADMIN')).toBe(true)
  })

  it('列表 DTO 永远不包含经销商字段，coverImage 取第一张图', () => {
    const item = toListItem(product)
    expect(item).not.toHaveProperty('dealerPrice')
    expect(item).not.toHaveProperty('moq')
    expect(item.coverImage).toBe('/images/prod_20_1.jpg')
    expect(item.categoryName).toBe('益智玩具')
    expect(item.id).toBe('101')
  })

  it('分类 DTO 保留后台排序值，编辑回填不会重置顺序', () => {
    expect(toCategory(makeCategory({ sortOrder: 7 }), 3)).toMatchObject({
      sortOrder: 7,
      productCount: 3
    })
  })
})

describe('CatalogService 公开接口（验收：草稿/下架产品不进入公开列表）', () => {
  const rows = [makeProduct(), makeProduct({ id: '102', sku: 'WM-BLC-02', slug: 'wooden-balance-board' })]
  const { publicService, publicQb } = buildServiceMocks(rows)

  it('列表查询固定附加 isPublished = 1 过滤', async () => {
    await publicService.listProducts({ page: 1, pageSize: 10 })
    const whereArgs = publicQb.calls.where.flat() as string[]
    expect(whereArgs.some((expr) => String(expr).includes('p.isPublished = 1'))).toBe(true)
  })

  it('分页默认 10、上限 50', async () => {
    const first = await publicService.listProducts({})
    expect(first).toMatchObject({ page: 1, pageSize: 10, total: rows.length })

    await publicService.listProducts({ page: 2, pageSize: 999 })
    const lastTake = publicQb.calls.take[publicQb.calls.take.length - 1]
    expect(lastTake[0]).toBe(50)
  })

  it('keyword 检索覆盖名称/SKU/卖点/场景/标签', async () => {
    await publicService.listProducts({ keyword: ' 保龄球 ' })
    const andWhere = publicQb.calls.andWhere.map((args) => String(args[0]))
    expect(andWhere.some((expr) => expr.includes('p.name LIKE') && expr.includes('p.sku LIKE'))).toBe(true)
  })

  it('featured=1 仅返回精选（#86 首页契约）', async () => {
    await publicService.listProducts({ featured: '1' })
    const andWhere = publicQb.calls.andWhere.map((args) => String(args[0]))
    expect(andWhere.some((expr) => expr.includes('p.isFeatured = 1'))).toBe(true)
  })

  it('sort=price_asc 按价格升序', async () => {
    await publicService.listProducts({ sort: 'price_asc' })
    const orderBy = publicQb.calls.orderBy[publicQb.calls.orderBy.length - 1]
    expect(orderBy[0]).toBe('p.price')
    expect(orderBy[1]).toBe('ASC')
  })

  it('sort=name_asc 按产品名称升序', async () => {
    await publicService.listProducts({ sort: 'name_asc' })
    const orderBy = publicQb.calls.orderBy[publicQb.calls.orderBy.length - 1]
    expect(orderBy[0]).toBe('p.name')
    expect(orderBy[1]).toBe('ASC')
  })

  it('slug 详情按角色裁剪', async () => {
    const guest = await publicService.getProductByKey('kids-bowling-set', 'GUEST')
    expect(guest.slug).toBe('kids-bowling-set')
    expect(guest).not.toHaveProperty('dealerPrice')

    const dealer = await publicService.getProductByKey('kids-bowling-set', 'DEALER')
    expect(dealer.dealerPrice).toBe(118)
  })

  it('纯数字 key 先按 slug 再按 id 兼容旧 /product/:id 外链', async () => {
    publicQb.qb.getOne = jest
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(rows[0])
    const detail = await publicService.getProductByKey('101', 'GUEST')
    expect(detail.id).toBe('101')
  })

  it('不存在或已下架的详情返回 404', async () => {
    publicQb.qb.getOne = jest.fn().mockResolvedValue(null)
    await expect(publicService.getProductByKey('ghost-slug', 'GUEST')).rejects.toThrow(
      NotFoundException
    )
  })
})

describe('CatalogAdminService 管理端（验收：SKU、slug 唯一）', () => {
  const { adminService, productRepo, categoryRepo } = buildServiceMocks([makeProduct()])

  it('新增产品：SKU 冲突返回 409', async () => {
    productRepo.findOne.mockImplementation(async (options: { where: Record<string, unknown> }) => {
      if (options.where.sku === 'WM-BWL-01') return makeProduct()
      if (options.where.slug) return null
      return null
    })
    await expect(
      adminService.createProduct({
        sku: 'WM-BWL-01',
        name: '重复 SKU 产品',
        categoryId: 1,
        price: 100,
        dealerPrice: 60
      })
    ).rejects.toThrow(ConflictException)
  })

  it('新增产品：slug 冲突返回 409，slug 留空时按 SKU 清洗生成', async () => {
    productRepo.findOne.mockImplementation(async (options: { where: Record<string, unknown> }) => {
      if (options.where.sku) return null
      if (options.where.slug === 'wm-new-sku') return makeProduct({ id: '999' })
      return null
    })
    await expect(
      adminService.createProduct({
        sku: 'WM/NEW SKU!!',
        name: '新产品',
        categoryId: 1,
        price: 100,
        dealerPrice: 60
      })
    ).rejects.toThrow(ConflictException)
  })

  it('新增产品：分类不存在返回 400（errors 指向 categoryId）', async () => {
    productRepo.findOne.mockResolvedValue(null)
    categoryRepo.findOne.mockResolvedValue(null)
    await expect(
      adminService.createProduct({
        sku: 'WM-NEW-02',
        name: '新产品',
        categoryId: 999,
        price: 100,
        dealerPrice: 60
      })
    ).rejects.toThrow(BadRequestException)
  })

  it('新增产品成功：slug 已清洗、默认 moq=10，返回管理 DTO', async () => {
    // 上一用例把分类置空，这里恢复为有效分类
    categoryRepo.findOne.mockResolvedValue(makeCategory())
    productRepo.findOne.mockImplementation(async (options: { where: Record<string, unknown> }) => {
      // 唯一性校验全部放行；保存后按 id 重载详情
      if (options.where.id !== undefined) {
        return { ...makeProduct(), sku: 'WM-NEW-03', slug: 'wm-new-03', name: '正常新产品' }
      }
      return null
    })
    productRepo.save.mockImplementation(async (input: Partial<Product>) => ({ ...input, id: '555' }))
    const created = await adminService.createProduct({
      sku: 'WM-NEW-03',
      name: '正常新产品',
      categoryId: 1,
      price: 199,
      dealerPrice: 120
    })
    expect(productRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ slug: 'wm-new-03', moq: 10, images: [] })
    )
    expect(created.sku).toBe('WM-NEW-03')
  })

  it('编辑产品：SKU 冲突校验会排除自身', async () => {
    productRepo.findOne.mockImplementation(async (options: { where: Record<string, unknown> }) => {
      const where = options.where ?? {}
      if (where.id === '101') return makeProduct() // findProductOrFail 按 id 加载
      if (where.sku === 'WM-BWL-01') return makeProduct() // 是自己 → 允许
      return null
    })
    const updated = await adminService.updateProduct('101', { sku: 'WM-BWL-01' })
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: '101', sku: 'WM-BWL-01' })
    )
    expect(updated.sku).toBe('WM-BWL-01')
  })

  it('发布/下架：按契约写入 isPublished 与可选 isFeatured', async () => {
    productRepo.findOne.mockResolvedValue(makeProduct())
    await adminService.updateProductStatus('101', { isPublished: 0, isFeatured: 1 })
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: '101', isPublished: 0, isFeatured: 1 })
    )
  })

  it('编辑产品：空文本会规范化为 NULL，允许后台真正清空可选字段', async () => {
    productRepo.findOne.mockResolvedValue(makeProduct())
    await adminService.updateProduct('101', {
      summary: '   ',
      description: '',
      material: '',
      scene: '',
      tag: ''
    })
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        summary: null,
        description: null,
        material: null,
        scene: null,
        tag: null
      })
    )
  })

  it('归档产品：保留数据库记录，仅下架并取消精选', async () => {
    productRepo.findOne.mockResolvedValue(makeProduct())
    await expect(adminService.deleteProduct('101')).resolves.toEqual({ id: '101', archived: true })
    expect(productRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: '101', isPublished: 0, isFeatured: 0 })
    )
    expect(productRepo.delete).not.toHaveBeenCalled()
  })

  it('管理详情/编辑：产品不存在返回 404', async () => {
    productRepo.findOne.mockResolvedValue(null)
    await expect(adminService.getProduct('404')).rejects.toThrow(NotFoundException)
    await expect(adminService.deleteProduct('404')).rejects.toThrow(NotFoundException)
  })

  it('分类删除：分类下仍有产品时返回 409（停售产品不删除历史关联口径）', async () => {
    categoryRepo.findOne.mockResolvedValue(makeCategory())
    productRepo.count.mockResolvedValue(3)
    await expect(adminService.deleteCategory('1')).rejects.toThrow(ConflictException)

    productRepo.count.mockResolvedValue(0)
    await expect(adminService.deleteCategory('1')).resolves.toEqual({ id: '1' })
  })
})
