import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { SessionGuard } from './session.guard'
import { OptionalSessionGuard } from './optional-session.guard'
import { RolesGuard } from './roles.guard'
import { CsrfGuard } from './csrf.guard'

/** 生产环境禁止使用开发密钥；Compose 会在缺失 JWT_SECRET 时更早拒绝启动。 */
function resolveJwtSecret(): string {
  const configured = process.env.JWT_SECRET
  if (configured) return configured
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be configured in production')
  }
  return 'wemove-dev-secret-change-me'
}

/**
 * 公共守卫/信封层（MVP-03 临时最小实现，正式实现以 #85 MVP-01 为准）
 *
 * 已按 #85 冻结契约 v1 编写：SessionGuard（Cookie 会话 + 查库校验 status）、
 * OptionalSessionGuard、RolesGuard + @Roles、CsrfGuard、统一信封与错误体。
 * #85 合并时可直接替换/扩充本目录，业务模块只依赖守卫与 @CurrentUser。
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => ({
        secret: resolveJwtSecret(),
        signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      })
    })
  ],
  providers: [SessionGuard, OptionalSessionGuard, RolesGuard, CsrfGuard],
  exports: [JwtModule, SessionGuard, OptionalSessionGuard, RolesGuard, CsrfGuard]
})
export class CommonModule {}
