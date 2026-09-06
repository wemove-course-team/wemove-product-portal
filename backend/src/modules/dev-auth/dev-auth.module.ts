import { Module } from '@nestjs/common'
import { IdentityController } from './identity.controller'
import { IdentityService } from './identity.service'

/**
 * ⚠️ 临时联调身份模块（MVP-03），#85 交付正式 identity 后整模块删除。
 */
@Module({
  controllers: [IdentityController],
  providers: [IdentityService],
  exports: [IdentityService]
})
export class DevAuthModule {}
