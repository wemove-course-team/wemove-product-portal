import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from './common/common.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { IdentityModule } from './modules/identity/identity.module'
import { DealerModule } from './modules/dealer/dealer.module'
import { ContentModule } from './modules/content/content.module'
import { SupportModule } from './modules/support/support.module'
import { OperationModule } from './modules/operation/operation.module'
import { User } from './modules/identity/user.entity'
import { PasswordResetToken } from './modules/identity/password-reset-token.entity'
import { DealerApplication } from './modules/dealer/dealer-application.entity'
import { DealerCompany } from './modules/dealer/dealer-company.entity'
import { Product } from './modules/catalog/product.entity'
import { ProductCategory } from './modules/catalog/category.entity'
import { Article } from './modules/content/entities/article.entity'
import { ArticleCategory } from './modules/content/entities/article-category.entity'
import { Page } from './modules/content/entities/page.entity'
import { SupportMessage, SupportFaq, SupportDownload } from './modules/support/support.entity'
import { resolveDatabaseConfig } from './database/db-config'
import { SiteConfig } from './modules/operation/site-config.entity'
import { Banner } from './modules/operation/banner.entity'
import { HealthController } from './health.controller'

/** 应用根模块，注册身份、产品、内容、经销商、支持与运营模块。 */
@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      // 延迟到 Nest 初始化时读取环境变量，支持 SQLite（无本地 MySQL 时自动降级）与 MySQL
      useFactory: () => {
        // 显式指定 sqlite、或未提供任何 MySQL 连接信息时才降级到 SQLite；
        // 生产环境缺少 MySQL 配置会直接抛错（见 db-config.ts），不会带演示账号启动。
        const { useSqlite, database } = resolveDatabaseConfig()
        const entities = [
          Product,
          ProductCategory,
          User,
          PasswordResetToken,
          DealerApplication,
          DealerCompany,
          Article,
          ArticleCategory,
          Page,
          SupportMessage,
          SupportFaq,
          SupportDownload,
          SiteConfig,
          Banner
        ]
        if (useSqlite) {
          return {
            type: 'sqlite' as const,
            database,
            entities,
            synchronize: false
          }
        }
        return {
          type: 'mysql' as const,
          host: process.env.DB_HOST || '127.0.0.1',
          port: Number(process.env.DB_PORT || 3306),
          username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_NAME || process.env.DB_DATABASE || 'wemove_portal',
          entities,
          // 数据库结构由 SQL 迁移维护，禁止启动时自动改表。
          synchronize: false,
          timezone: 'Z',
          charset: 'utf8mb4_unicode_ci'
        }
      }
    }),
    CommonModule,
    IdentityModule,
    DealerModule,
    CatalogModule,
    ContentModule,
    SupportModule,
    OperationModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
