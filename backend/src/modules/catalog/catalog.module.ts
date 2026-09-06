import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Product } from './product.entity'
import { ProductCategory } from './category.entity'
import { CatalogService } from './catalog.service'
import { CatalogAdminService } from './catalog-admin.service'
import { CatalogPublicController } from './catalog-public.controller'
import { CatalogAdminController } from './catalog-admin.controller'

/**
 * 产品目录域（#87 MVP-03）
 *
 * 公开：GET /products、/products/:slug、/categories（OptionalSessionGuard 支持经销商价裁剪）
 * 管理：/admin/products*、/admin/categories*（SessionGuard + RolesGuard + @Roles('ADMIN')）
 */
@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductCategory])],
  controllers: [CatalogPublicController, CatalogAdminController],
  providers: [CatalogService, CatalogAdminService],
  exports: [CatalogService]
})
export class CatalogModule {}
