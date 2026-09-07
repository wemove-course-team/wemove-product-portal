import { Type } from 'class-transformer'
import {
  IsArray,
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength
} from 'class-validator'

/** 非法 slug 字符统一清洗（中文/空格等 → '-'），用于 slug 留空时的自动回退 */
export function sanitizeSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100)
}

// ------------------------------ 公开查询 ------------------------------

export class ProductQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number

  // pageSize 不做 @Max：只读接口对超限值按上限 50 钳制返回（服务层统一处理）
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pageSize?: number

  @IsOptional() @IsString() @MaxLength(64)
  keyword?: string

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  categoryId?: number

  /** '1' 仅精选（#86 首页「精选产品」消费该参数） */
  @IsOptional() @IsIn(['0', '1'])
  featured?: '0' | '1'

  /** 年龄段过滤：3-6 / 6-10 / 10-plus（与前台筛选器约定一致） */
  @IsOptional() @IsIn(['3-6', '6-10', '10-plus'])
  age?: '3-6' | '6-10' | '10-plus'

  @IsOptional() @IsIn(['default', 'price_asc', 'price_desc', 'newest', 'name_asc'])
  sort?: 'default' | 'price_asc' | 'price_desc' | 'newest' | 'name_asc'
}

// ------------------------------ 管理端 ------------------------------

export class AdminProductQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  pageSize?: number

  @IsOptional() @IsString() @MaxLength(64)
  keyword?: string

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  categoryId?: number

  /** all=全部（默认） published=已发布 draft=草稿/下架 */
  @IsOptional() @IsIn(['all', 'published', 'draft'])
  status?: 'all' | 'published' | 'draft'
}

export class CreateProductDto {
  @IsString() @MinLength(2) @MaxLength(64)
  sku: string

  @IsString() @MinLength(1) @MaxLength(128)
  name: string

  /** 留空时按 sku 自动生成（小写、非法字符转 -），保证 slug 唯一约束可用 */
  @IsOptional() @IsString() @MaxLength(128)
  @Matches(/^[A-Za-z0-9-]*$/, { message: 'slug 仅允许字母、数字与中划线' })
  slug?: string

  @Type(() => Number) @IsInt() @Min(1)
  categoryId: number

  @Type(() => Number) @IsNumber() @Min(0)
  price: number

  @Type(() => Number) @IsNumber() @Min(0)
  dealerPrice: number

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  moq?: number

  @IsOptional() @IsString() @MaxLength(64)
  ageRange?: string

  @IsOptional() @IsString() @MaxLength(128)
  material?: string

  @IsOptional() @IsString() @MaxLength(255)
  scene?: string

  @IsOptional() @IsString() @MaxLength(500)
  summary?: string

  @IsOptional() @IsString()
  description?: string

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[]

  @IsOptional() @IsObject()
  specs?: Record<string, unknown>

  @IsOptional() @Type(() => Number) @IsIn([0, 1])
  isPublished?: 0 | 1

  @IsOptional() @Type(() => Number) @IsIn([0, 1])
  isFeatured?: 0 | 1

  @IsOptional() @IsString() @MaxLength(32)
  tag?: string
}

export class UpdateProductDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(64)
  sku?: string

  @IsOptional() @IsString() @MinLength(1) @MaxLength(128)
  name?: string

  @IsOptional() @IsString() @MaxLength(128)
  @Matches(/^[A-Za-z0-9-]*$/, { message: 'slug 仅允许字母、数字与中划线' })
  slug?: string

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  categoryId?: number

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  price?: number

  @IsOptional() @Type(() => Number) @IsNumber() @Min(0)
  dealerPrice?: number

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  moq?: number

  @IsOptional() @IsString() @MaxLength(64)
  ageRange?: string

  @IsOptional() @IsString() @MaxLength(128)
  material?: string

  @IsOptional() @IsString() @MaxLength(255)
  scene?: string

  @IsOptional() @IsString() @MaxLength(500)
  summary?: string

  @IsOptional() @IsString()
  description?: string

  @IsOptional() @IsArray() @IsString({ each: true })
  images?: string[]

  @IsOptional() @IsObject()
  specs?: Record<string, unknown>

  @IsOptional() @Type(() => Number) @IsIn([0, 1])
  isPublished?: 0 | 1

  @IsOptional() @Type(() => Number) @IsIn([0, 1])
  isFeatured?: 0 | 1

  @IsOptional() @IsString() @MaxLength(32)
  tag?: string
}

/** PUT /admin/products/:id/status —— body: { isPublished: 0|1, isFeatured?: 0|1 }（#87 评论契约） */
export class UpdateProductStatusDto {
  @Type(() => Number) @IsIn([0, 1])
  isPublished: 0 | 1

  @IsOptional() @Type(() => Number) @IsIn([0, 1])
  isFeatured?: 0 | 1
}

export class CreateCategoryDto {
  @IsString() @MinLength(1) @MaxLength(64)
  name: string

  @IsString() @MinLength(2) @MaxLength(64)
  @Matches(/^[A-Za-z0-9-]+$/, { message: 'slug 仅允许字母、数字与中划线' })
  slug: string

  @IsOptional() @IsString() @MaxLength(255)
  description?: string

  @IsOptional() @Type(() => Number) @IsInt()
  sortOrder?: number
}

export class UpdateCategoryDto {
  @IsOptional() @IsString() @MinLength(1) @MaxLength(64)
  name?: string

  @IsOptional() @IsString() @MinLength(2) @MaxLength(64)
  @Matches(/^[A-Za-z0-9-]+$/, { message: 'slug 仅允许字母、数字与中划线' })
  slug?: string

  @IsOptional() @IsString() @MaxLength(255)
  description?: string

  @IsOptional() @Type(() => Number) @IsInt()
  sortOrder?: number
}
