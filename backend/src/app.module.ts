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

/** 应用根模块，注册公共、身份和产品目录模块。 */
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
        // 数据库结构由 SQL 迁移维护，禁止启动时自动改表。
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
