import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '../../common/common.module'
import { AdminUsersController } from './admin-users.controller'
import { IdentityController } from './identity.controller'
import { PasswordResetToken } from './password-reset-token.entity'
import { IdentityService } from './identity.service'
import { User } from './user.entity'

/** 身份、会话和用户管理模块。 */
@Module({
  imports: [TypeOrmModule.forFeature([User, PasswordResetToken]), CommonModule],
  controllers: [IdentityController, AdminUsersController],
  providers: [IdentityService],
  exports: [IdentityService, TypeOrmModule]
})
export class IdentityModule {}
