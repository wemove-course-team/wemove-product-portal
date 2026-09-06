import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SessionGuard } from './session.guard'
import { OptionalSessionGuard } from './optional-session.guard'
import { RolesGuard } from './roles.guard'
import { CsrfGuard } from './csrf.guard'

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
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET', 'wemove-dev-secret-change-me'),
        signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') }
      })
    })
  ],
  providers: [SessionGuard, OptionalSessionGuard, RolesGuard, CsrfGuard],
  exports: [JwtModule, SessionGuard, OptionalSessionGuard, RolesGuard, CsrfGuard]
})
export class CommonModule {}
