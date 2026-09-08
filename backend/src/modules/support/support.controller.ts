import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/current-user.decorator'
import { OptionalSessionGuard } from '../../common/optional-session.guard'
import { RequestUser } from '../../common/request-user'
import { Roles, RolesGuard } from '../../common/roles.guard'
import { SessionGuard } from '../../common/session.guard'
import { CreateDownloadDto, CreateFaqDto, CreateMessageDto, MessageQueryDto, UpdateDownloadDto, UpdateFaqDto, UpdateMessageStatusDto } from './support.dto'
import { SupportService } from './support.service'

@Controller('support')
export class SupportController {
  constructor(private readonly support: SupportService) {}

  @Post('messages') createMessage(@Body() body: CreateMessageDto) { return this.support.createMessage(body) }
}

/** FAQ 和下载使用官网既有的根路径，电子说明书入口也复用这组接口。 */
@Controller()
export class PublicSupportController {
  constructor(private readonly support: SupportService) {}

  @Get('faqs') listFaqs(@Query('keyword') keyword?: string, @Query('category') category?: string) { return this.support.listFaqs(keyword, category) }

  @Get('downloads')
  @UseGuards(OptionalSessionGuard)
  listDownloads(@CurrentUser() user: RequestUser | null, @Query('category') category?: string) { return this.support.listDownloads(user, category) }

  @Get('downloads/:id/access')
  @UseGuards(OptionalSessionGuard)
  accessDownload(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: RequestUser | null) { return this.support.getDownloadAccess(id, user) }
}

@Controller('admin/support')
@UseGuards(SessionGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSupportController {
  constructor(private readonly support: SupportService) {}

  @Get('messages') listMessages(@Query() query: MessageQueryDto) { return this.support.listMessages(query) }
  @Get('messages/:id') getMessage(@Param('id', ParseIntPipe) id: number) { return this.support.getMessage(id) }
  @Patch('messages/:id/status') updateMessage(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateMessageStatusDto, @CurrentUser() user: RequestUser) { return this.support.updateMessageStatus(id, body, user) }

  @Get('faqs') listAdminFaqs(@Query('keyword') keyword?: string, @Query('category') category?: string) { return this.support.listFaqs(keyword, category, true) }
  @Post('faqs') createFaq(@Body() body: CreateFaqDto) { return this.support.createFaq(body) }
  @Patch('faqs/:id') updateFaq(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateFaqDto) { return this.support.updateFaq(id, body) }
  @Delete('faqs/:id') deleteFaq(@Param('id', ParseIntPipe) id: number) { return this.support.deleteFaq(id) }

  @Get('downloads') listAdminDownloads(@Query('category') category?: string) { return this.support.listAdminDownloads(category) }
  @Post('downloads') createDownload(@Body() body: CreateDownloadDto) { return this.support.createDownload(body) }
  @Patch('downloads/:id') updateDownload(@Param('id', ParseIntPipe) id: number, @Body() body: UpdateDownloadDto) { return this.support.updateDownload(id, body) }
  @Delete('downloads/:id') deleteDownload(@Param('id', ParseIntPipe) id: number) { return this.support.deleteDownload(id) }
}
