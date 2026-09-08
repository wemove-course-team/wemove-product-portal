import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from './common/common.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { IdentityModule } from './modules/identity/identity.module'
import { DealerModule } from './modules/dealer/dealer.module'
import { SupportModule } from './modules/support/support.module' // 1. 引入 SupportModule (请确认你项目中的真实路径)

import { User } from './modules/identity/user.entity'
import { PasswordResetToken } from './modules/identity/password-reset-token.entity'
import { DealerApplication } from './modules/dealer/dealer-application.entity'
import { DealerCompany } from './modules/dealer/dealer-company.entity'
import { Product } from './modules/catalog/product.entity'
import { ProductCategory } from './modules/catalog/category.entity'
// 2. 引入 Support 相关的三个实体 (请确认真实路径)
import { SupportMessage, SupportFaq, SupportManual } from './modules/support/support.entity'

import { HealthController } from './health.controller'

/** 应用根模块，注册公共、身份、产品目录及服务支持模块。 */
@Module({
    imports: [
        TypeOrmModule.forRootAsync({
            // 延迟到 Nest 初始化时读取环境变量，确保 e2e 可在应用启动前注入独立测试库配置。
            useFactory: () => ({
                type: 'mysql' as const,
                host: process.env.DB_HOST || '127.0.0.1',
                port: Number(process.env.DB_PORT || 3306),
                username: process.env.DB_USER || process.env.DB_USERNAME || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || process.env.DB_DATABASE || 'wemove_portal',
                // 3. 将 Support 的三个实体追加到 entities 数组中
                entities: [
                    Product,
                    ProductCategory,
                    User,
                    PasswordResetToken,
                    DealerApplication,
                    DealerCompany,
                    SupportMessage,
                    SupportFaq,
                    SupportManual
                ],
                // 数据库结构由 SQL 迁移维护，禁止启动时自动改表。
                synchronize: false,
                timezone: 'Z',
                charset: 'utf8mb4_unicode_ci'
            })
        }),
        CommonModule,
        IdentityModule,
        DealerModule,
        CatalogModule,
        SupportModule // 4. 在 imports 中注册 SupportModule
    ],
    controllers: [HealthController]
})
export class AppModule { }