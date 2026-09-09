import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/current-user.decorator'
import { RequestUser } from '../../common/request-user'
import { Roles, RolesGuard } from '../../common/roles.guard'
import { SessionGuard } from '../../common/session.guard'
import { CreateDealerApplicationDto, DealerApplicationQueryDto, ReviewDealerApplicationDto } from './dealer.dto'
import { DealerService } from './dealer.service'
import { DealerWorkspaceService } from './dealer-workspace.service'
import {
  AdminInvoiceStatusDto, AdminOrderStatusDto, AdminQuoteDecisionDto,
  CreateDealerAddressDto, CreateDealerOrderDto, CreateDealerQuoteDto,
  DealerWorkspaceQueryDto, UpdateDealerCompanyDto, UpdateDealerCompanyStatusDto
} from './dealer-workspace.dto'

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

@Controller('dealer/workspace')
@UseGuards(SessionGuard, RolesGuard)
@Roles('DEALER')
export class DealerWorkspaceController {
  constructor(private readonly workspace: DealerWorkspaceService) {}

  @Get('summary') summary(@CurrentUser() user: RequestUser) { return this.workspace.summary(user) }
  @Get('catalog') catalog(@CurrentUser() user: RequestUser, @Query() query: DealerWorkspaceQueryDto) { return this.workspace.catalog(user, query) }
  @Get('quotes') quotes(@CurrentUser() user: RequestUser, @Query() query: DealerWorkspaceQueryDto) { return this.workspace.quotes(user, query) }
  @Post('quotes') createQuote(@CurrentUser() user: RequestUser, @Body() body: CreateDealerQuoteDto) { return this.workspace.createQuote(user, body) }
  @Get('orders') orders(@CurrentUser() user: RequestUser, @Query() query: DealerWorkspaceQueryDto) { return this.workspace.orders(user, query) }
  @Post('orders') createOrder(@CurrentUser() user: RequestUser, @Body() body: CreateDealerOrderDto) { return this.workspace.createOrder(user, body) }
  @Get('invoices') invoices(@CurrentUser() user: RequestUser, @Query() query: DealerWorkspaceQueryDto) { return this.workspace.invoices(user, query) }
  @Get('company') company(@CurrentUser() user: RequestUser) { return this.workspace.company(user) }
  @Put('company') updateCompany(@CurrentUser() user: RequestUser, @Body() body: UpdateDealerCompanyDto) { return this.workspace.updateCompany(user, body) }
  @Post('addresses') createAddress(@CurrentUser() user: RequestUser, @Body() body: CreateDealerAddressDto) { return this.workspace.createAddress(user, body) }
}

@Controller('admin/dealer')
@UseGuards(SessionGuard, RolesGuard)
@Roles('ADMIN')
export class DealerAdminController {
  constructor(private readonly dealer: DealerService, private readonly workspace: DealerWorkspaceService) {}

  @Get('applications')
  list(@Query() query: DealerApplicationQueryDto) {
    return this.dealer.list(query)
  }

  @Patch('applications/:id/review')
  review(@Param('id') id: string, @Body() body: ReviewDealerApplicationDto) {
    return this.dealer.review(id, body)
  }

  @Get('companies')
  companies(@Query('status') status?: string) { return this.dealer.listCompanies(status) }

  @Patch('companies/:id/status')
  updateCompanyStatus(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateDealerCompanyStatusDto) {
    return this.dealer.updateCompanyStatus(id, body.status)
  }

  @Get('quotes')
  quotes(@Query() query: DealerWorkspaceQueryDto) { return this.workspace.adminQuotes(query) }

  @Patch('quotes/:quoteNo/decision')
  decideQuote(@Param('quoteNo') quoteNo: string, @Body() body: AdminQuoteDecisionDto) {
    return this.workspace.decideQuote(quoteNo, body)
  }

  @Get('orders')
  orders(@Query() query: DealerWorkspaceQueryDto) { return this.workspace.adminOrders(query) }

  @Patch('orders/:orderNo/status')
  updateOrderStatus(@Param('orderNo') orderNo: string, @Body() body: AdminOrderStatusDto) {
    return this.workspace.updateOrderStatus(orderNo, body)
  }

  @Get('invoices')
  invoices(@Query() query: DealerWorkspaceQueryDto) { return this.workspace.adminInvoices(query) }

  @Patch('invoices/:invoiceNo/status')
  updateInvoiceStatus(@Param('invoiceNo') invoiceNo: string, @Body() body: AdminInvoiceStatusDto) {
    return this.workspace.updateInvoiceStatus(invoiceNo, body)
  }
}
