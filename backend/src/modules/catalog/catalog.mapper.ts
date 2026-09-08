import { Product } from './product.entity'
import { ProductCategory } from './category.entity'

/**
 * DTO 映射（#87 评论冻结的交接 DTO）：
 * - ProductListItem：公开列表/搜索/精选（无任何经销商字段）
 * - ProductDetail：公开详情；dealerPrice/moq 仅当会话角色为 DEALER/ADMIN 时附加
 * - Category：公开分类（productCount 只统计已发布产品）
 * - AdminProduct：管理端完整视图（含 dealerPrice/moq 与发布状态）
 *
 * id/categoryId 按契约样例输出为字符串（BIGINT 精度安全）。
 */
export type ViewerRole = 'GUEST' | 'USER' | 'DEALER' | 'ADMIN'

export interface ProductListItem {
  id: string
  sku: string
  name: string
  slug: string
  categoryId: string
  categoryName: string | null
  price: number
  tag: string | null
  coverImage: string | null
  summary: string | null
  isFeatured: number
  /** 增量字段（相对 #87 冻结 DTO）：PLP-001 列表卡片需展示适用年龄 */
  ageRange: string | null
}

export interface ProductDetail extends ProductListItem {
  description: string | null
  images: string[]
  specs: Record<string, unknown>
  ageRange: string | null
  material: string | null
  scene: string | null
  /** 以下字段仅 DEALER/ADMIN 可见（服务端按角色裁剪） */
  dealerPrice?: number
  moq?: number
}

export interface CategoryDto {
  id: string
  name: string
  slug: string
  description: string | null
  sortOrder: number
  productCount: number
}

export interface AdminProductDto {
  id: string
  sku: string
  name: string
  slug: string
  categoryId: string
  categoryName: string | null
  price: number
  dealerPrice: number
  moq: number
  ageRange: string | null
  material: string | null
  scene: string | null
  summary: string | null
  description: string | null
  images: string[]
  specs: Record<string, unknown>
  isPublished: number
  isFeatured: number
  tag: string | null
  createdAt: string
  updatedAt: string
}

export function canSeeDealerPrice(role: ViewerRole | null | undefined): boolean {
  return role === 'DEALER' || role === 'ADMIN'
}

export function toListItem(product: Product): ProductListItem {
  return {
    id: String(product.id),
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    categoryId: String(product.categoryId),
    categoryName: product.category?.name ?? null,
    price: Number(product.price),
    tag: product.tag ?? null,
    coverImage: (product.images && product.images[0]) || null,
    summary: product.summary ?? null,
    isFeatured: Number(product.isFeatured),
    ageRange: product.ageRange ?? null
  }
}

export function toDetail(product: Product, role: ViewerRole | null | undefined): ProductDetail {
  const detail: ProductDetail = {
    ...toListItem(product),
    description: product.description ?? null,
    images: product.images ?? [],
    specs: product.specs ?? {},
    ageRange: product.ageRange ?? null,
    material: product.material ?? null,
    scene: product.scene ?? null
  }
  if (canSeeDealerPrice(role)) {
    detail.dealerPrice = Number(product.dealerPrice)
    detail.moq = Number(product.moq)
  }
  return detail
}

export function toAdminProduct(product: Product): AdminProductDto {
  return {
    id: String(product.id),
    sku: product.sku,
    name: product.name,
    slug: product.slug,
    categoryId: String(product.categoryId),
    categoryName: product.category?.name ?? null,
    price: Number(product.price),
    dealerPrice: Number(product.dealerPrice),
    moq: Number(product.moq),
    ageRange: product.ageRange ?? null,
    material: product.material ?? null,
    scene: product.scene ?? null,
    summary: product.summary ?? null,
    description: product.description ?? null,
    images: product.images ?? [],
    specs: product.specs ?? {},
    isPublished: Number(product.isPublished),
    isFeatured: Number(product.isFeatured),
    tag: product.tag ?? null,
    createdAt: product.createdAt ? new Date(product.createdAt).toISOString() : null,
    updatedAt: product.updatedAt ? new Date(product.updatedAt).toISOString() : null
  } as AdminProductDto
}

export function toCategory(category: ProductCategory, productCount: number): CategoryDto {
  return {
    id: String(category.id),
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    sortOrder: Number(category.sortOrder),
    productCount
  }
}
