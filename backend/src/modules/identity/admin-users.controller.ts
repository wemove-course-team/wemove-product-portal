import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/current-user.decorator'
import { RequestUser } from '../../common/request-user'
import { Roles, RolesGuard } from '../../common/roles.guard'
import { SessionGuard } from '../../common/session.guard'
import { AdminUserQueryDto, UpdateUserStatusDto } from './identity.dto'
import { IdentityService } from './identity.service'

@Controller('admin/users')
@UseGuards(SessionGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly identity: IdentityService) {}

  @Get()
  list(@Query() query: AdminUserQueryDto) { return this.identity.listUsers(query) }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateUserStatusDto, @CurrentUser() actor: RequestUser) {
    return this.identity.updateUserStatus(id, body.status, actor.id)
  }
}
