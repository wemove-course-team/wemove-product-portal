import { Global, Module } from '@nestjs/common'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { SessionGuard } from './session.guard'
import { OptionalSessionGuard } from './optional-session.guard'
import { RolesGuard } from './roles.guard'
import { CsrfGuard } from './csrf.guard'

/** 公共守卫和 JWT 配置，供各业务模块复用。 */
@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET')
        const isProduction = config.get<string>('NODE_ENV') === 'production'
        if (isProduction && !secret) throw new Error('生产环境必须配置 JWT_SECRET')
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
