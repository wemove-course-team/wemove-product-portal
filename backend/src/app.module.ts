import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from './common/common.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { IdentityModule } from './modules/identity/identity.module'
import { User } from './modules/identity/user.entity'
import { PasswordResetToken } from './modules/identity/password-reset-token.entity'
import { Product } from './modules/catalog/product.entity'
import { ProductCategory } from './modules/catalog/category.entity'
import { HealthController } from './health.controller'

/**
 * 应用根模块（MVP-01 Identity 基准）
 *
 * 模块归属（AI_DEVELOPMENT_RULES 规则 5）：
 * - common/（守卫、信封、错误体）：统一公共契约与访问控制
 * - modules/catalog：#87 MVP-03 产品域
 * - modules/identity：#85 平台身份、会话与用户管理
 * - modules/content / support / dealer / operation：#88 / #89 / #90 / #91
 */
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.get<string>('DB_HOST', '127.0.0.1'),
        port: config.get<number>('DB_PORT', 3306),
        username: config.get<string>('DB_USER') || config.get<string>('DB_USERNAME', 'root'),
        password: config.get<string>('DB_PASSWORD', ''),
        database: config.get<string>('DB_NAME') || config.get<string>('DB_DATABASE', 'wemove_portal'),
        entities: [Product, ProductCategory, User, PasswordResetToken],
        // 建表与增量一律走 sql/ 脚本（决策 D6），禁止 synchronize 改表
        synchronize: false,
        timezone: 'Z',
        charset: 'utf8mb4_unicode_ci'
      })
    }),
    CommonModule,
    IdentityModule,
    CatalogModule
  ],
  controllers: [HealthController]
})
export class AppModule {}
