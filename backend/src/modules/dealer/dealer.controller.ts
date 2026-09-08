import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/current-user.decorator'
import { RequestUser } from '../../common/request-user'
import { Roles, RolesGuard } from '../../common/roles.guard'
import { SessionGuard } from '../../common/session.guard'
import { CreateDealerApplicationDto, DealerApplicationQueryDto, ReviewDealerApplicationDto } from './dealer.dto'
import { DealerService } from './dealer.service'

@Controller('dealer')
@UseGuards(SessionGuard)
export class DealerController {
  constructor(private readonly dealer: DealerService) {}

  @Post('applications')
  create(@CurrentUser() user: RequestUser, @Body() body: CreateDealerApplicationDto) {
    return this.dealer.create(user as any, body)
  }

  @Get('applications/mine')
  mine(@CurrentUser() user: RequestUser) {
    return this.dealer.mine(user as any)
  }

  @Get('portal/me')
  portal(@CurrentUser() user: RequestUser) {
    return this.dealer.portal(user as any)
  }
}

@Controller('admin/dealer/applications')
@UseGuards(SessionGuard, RolesGuard)
@Roles('ADMIN')
export class DealerAdminController {
  constructor(private readonly dealer: DealerService) {}

  @Get()
  list(@Query() query: DealerApplicationQueryDto) {
    return this.dealer.list(query)
  }

  @Patch(':id/review')
  review(@Param('id') id: string, @Body() body: ReviewDealerApplicationDto) {
    return this.dealer.review(id, body)
  }
}
