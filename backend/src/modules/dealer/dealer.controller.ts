import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common'
import { AuthenticatedRequest } from '../identity/auth.types'
import { SessionGuard } from '../identity/auth.guard'
import { CreateDealerApplicationDto, ReviewDealerApplicationDto } from './dealer.dto'
import { DealerService } from './dealer.service'
import { ok } from '../../common/api-envelope'

@Controller('dealer')
export class DealerController {
  constructor(private readonly service: DealerService) {}
  @Post('applications') @UseGuards(SessionGuard) async create(@Req() req: AuthenticatedRequest, @Body() body: CreateDealerApplicationDto) { return ok(await this.service.create(req.user!, body), '申请提交成功') }
  @Get('applications/mine') @UseGuards(SessionGuard) async mine(@Req() req: AuthenticatedRequest) { return ok(await this.service.mine(req.user!)) }
  @Get('portal/me') @UseGuards(SessionGuard) async portal(@Req() req: AuthenticatedRequest) { return ok(await this.service.portal(req.user!)) }
}

@Controller('admin/dealer/applications')
export class DealerAdminController {
  constructor(private readonly service: DealerService) {}
  @Get() @UseGuards(SessionGuard) async list(@Req() req: AuthenticatedRequest, @Query('status') status?: string, @Query('page') page?: number, @Query('pageSize') pageSize?: number) { this.assertAdmin(req); return ok(await this.service.list(status, page, pageSize)) }
  @Patch(':id/review') @UseGuards(SessionGuard) async review(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() body: ReviewDealerApplicationDto) { this.assertAdmin(req); return ok(await this.service.review(id, body), '审核完成') }
  private assertAdmin(req: AuthenticatedRequest) { if (req.user?.role !== 'ADMIN') throw new ForbiddenException({ code: 'FORBIDDEN_403', message: '您没有权限执行此操作' }) }
}
