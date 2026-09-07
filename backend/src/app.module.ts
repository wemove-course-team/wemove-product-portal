import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from './common/common.module'
import { CatalogModule } from './modules/catalog/catalog.module'
import { DevAuthModule } from './modules/dev-auth/dev-auth.module'
import { Product } from './modules/catalog/product.entity'
import { ProductCategory } from './modules/catalog/category.entity'

/**
 * 应用根模块（MVP-03 临时骨架）
 *
 * 模块归属（AI_DEVELOPMENT_RULES 规则 5）：
 * - common/（守卫、信封、错误体）：MVP-03 最小实现，#85 合并时以正式实现为准
 * - modules/catalog：#87 MVP-03 产品域
 * - modules/dev-auth：MVP-03 临时登录（login/me/csrf），#85 交付 identity 后删除并接入正式模块
 *   ── 替换点：将 DevAuthModule 换为 #85 的 IdentityModule，路由契约不变 ──
 * - modules/identity / content / support / dealer / operation：#85 / #88 / #89 / #90 / #91
 */
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
        entities: [Product, ProductCategory],
        // 建表与增量一律走 sql/ 脚本（决策 D6），禁止 synchronize 改表
        synchronize: false,
        timezone: 'Z',
        charset: 'utf8mb4_unicode_ci'
      })
    }),
    CommonModule,
    DevAuthModule,
    CatalogModule
  ]
})
export class AppModule {}
