import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SessionGuard } from './session.guard'
import { OptionalSessionGuard } from './optional-session.guard'
import { RolesGuard } from './roles.guard'
import { CsrfGuard } from './csrf.guard'

/**
 * 公共守卫/信封层（#85 MVP-01 基准）
 *
 * 业务模块只依赖守卫、角色装饰器与 @CurrentUser，不感知会话内部实现。
 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')
        const isProduction = config.get<string>('NODE_ENV') === 'production'
        if (isProduction && !secret) throw new Error('JWT_SECRET is required in production')
        return {
          secret: secret || 'wemove-dev-secret-change-me',
          signOptions: { expiresIn: config.get<string>('JWT_EXPIRES_IN', '7d') }
        }
      }
    })
  ],
  providers: [SessionGuard, OptionalSessionGuard, RolesGuard, CsrfGuard],
  exports: [JwtModule, SessionGuard, OptionalSessionGuard, RolesGuard, CsrfGuard]
})
export class CommonModule {}
