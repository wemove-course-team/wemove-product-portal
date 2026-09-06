import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common'
import { Request } from 'express'
import { OptionalSessionGuard } from '../../common/optional-session.guard'
import { CatalogService } from './catalog.service'
import { ProductQueryDto } from './dto/catalog.dto'
import type { ViewerRole } from './catalog.mapper'

/**
 * 产品目录公开接口（#87 MVP-03）
 *
 * 会话可选：DEALER/ADMIN 会话下详情 DTO 附加 dealerPrice/moq；
 * 游客/普通用户的响应永不包含经销商字段（服务端裁剪，与 #90 经销商门户共用本接口）。
 */
@Controller()
@UseGuards(OptionalSessionGuard)
export class CatalogPublicController {
  constructor(private readonly catalogService: CatalogService) {}

  /** GET /api/v1/products?page&pageSize&keyword&categoryId&featured[&age&sort] */
  @Get('products')
  listProducts(@Query() query: ProductQueryDto, @Req() req: Request) {
    // 列表接口不返回经销商价格：ListItem DTO 本身无 dealerPrice/moq 字段
    return this.catalogService.listProducts(query)
  }

  /** GET /api/v1/products/:slug（纯数字 key 兼容旧 /product/:id 外链） */
  @Get('products/:slug')
  getProduct(@Param('slug') slug: string, @Req() req: Request) {
    const role = (req.user?.role ?? 'GUEST') as ViewerRole
    return this.catalogService.getProductByKey(slug, role)
  }

  /** GET /api/v1/categories */
  @Get('categories')
  listCategories() {
    return this.catalogService.listCategories()
  }
}
