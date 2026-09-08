import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards
} from '@nestjs/common'
import { SessionGuard } from '../../common/session.guard'
import { RolesGuard, Roles } from '../../common/roles.guard'
import { CatalogAdminService } from './catalog-admin.service'
import {
  AdminProductQueryDto,
  CreateCategoryDto,
  CreateProductDto,
  UpdateCategoryDto,
  UpdateProductDto,
  UpdateProductStatusDto
} from './dto/catalog.dto'

/**
 * 产品/分类管理接口（#87 MVP-03）：仅 ADMIN（权限由后端裁决，决策 D5）。
 * 路由前缀 /admin，与 #85 的 /admin/users 同级。
 */
@Controller('admin')
@UseGuards(SessionGuard, RolesGuard)
export class CatalogAdminController {
  constructor(private readonly catalogAdminService: CatalogAdminService) {}

  // ------------------------------ 产品 ------------------------------

  @Roles('ADMIN')
  @Get('products')
  listProducts(@Query() query: AdminProductQueryDto) {
    return this.catalogAdminService.listProducts(query)
  }

  @Roles('ADMIN')
  @Get('products/:id')
  getProduct(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.getProduct(String(id))
  }

  @Roles('ADMIN')
  @Post('products')
  createProduct(@Body() dto: CreateProductDto) {
    return this.catalogAdminService.createProduct(dto)
  }

  @Roles('ADMIN')
  @Put('products/:id')
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.catalogAdminService.updateProduct(String(id), dto)
  }

  /** 发布/下架：body { isPublished: 0|1, isFeatured? } */
  @Roles('ADMIN')
  @Put('products/:id/status')
  updateProductStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProductStatusDto
  ) {
    return this.catalogAdminService.updateProductStatus(String(id), dto)
  }

  @Roles('ADMIN')
  @Delete('products/:id')
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteProduct(String(id))
  }

  // ------------------------------ 分类 ------------------------------

  @Roles('ADMIN')
  @Get('categories')
  listCategories() {
    return this.catalogAdminService.listCategoriesForAdmin()
  }

  @Roles('ADMIN')
  @Post('categories')
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.catalogAdminService.createCategory(dto)
  }

  @Roles('ADMIN')
  @Put('categories/:id')
  updateCategory(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateCategoryDto) {
    return this.catalogAdminService.updateCategory(String(id), dto)
  }

  @Roles('ADMIN')
  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.catalogAdminService.deleteCategory(String(id))
  }
}
