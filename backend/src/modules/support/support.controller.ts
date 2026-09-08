import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Req,
    HttpCode,
    HttpStatus,
    ParseIntPipe,
} from '@nestjs/common';
import { SupportService } from './support.service';
import {
    CreateMessageDto,
    CreateFaqDto,
    UpdateFaqDto,
    UpdateMessageStatusDto,
    QueryMessageDto,
    QueryFaqDto
} from './support.dto';

// ==========================================
// 1. 公开与前台 C 端接口 (/api/v1/support/...)
// ==========================================
@Controller('support')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    // 提交联系留言 -> POST /api/v1/support/messages
    @Post('messages')
    @HttpCode(HttpStatus.CREATED)
    async submitMessage(@Body() body: CreateMessageDto) {
        return await this.supportService.createMessage(body);
    }

    // 获取 FAQ 列表 -> GET /api/v1/support/faqs
    @Get('faqs')
    async getPublicFaqs(@Query() query: QueryFaqDto) {
        return await this.supportService.getPublicFaqs(query.category, query.keyword);
    }

    // 获取公开说明书列表 -> GET /api/v1/support/manuals
    @Get('manuals')
    async getPublicManuals(@Req() req: any) {
        const userRole = req.user?.role || 'PUBLIC';
        return await this.supportService.getPublicManuals(userRole);
    }

    // 检查说明书下载/访问权限 -> GET /api/v1/support/manuals/:id/access
    @Get('manuals/:id/access')
    async checkManualAccess(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
        const userRole = req.user?.role || 'PUBLIC';
        return await this.supportService.checkManualAccess(id, userRole);
    }
}

// ==========================================
// 2. 后台管理 B 端接口 (/api/v1/admin/support/...)
// 注：待 MVP-01 骨架合入后，在此 Controller 上挂载 @UseGuards(SessionGuard, RolesGuard)
// ==========================================
@Controller('admin/support')
export class AdminSupportController {
    constructor(private readonly supportService: SupportService) { }

    // 查询留言列表 -> GET /api/v1/admin/support/messages
    @Get('messages')
    async getAdminMessages(@Query() query: QueryMessageDto) {
        return await this.supportService.getMessages(
            query.page || 1,
            query.pageSize || 10,
            query.status,
        );
    }

    // 查看留言详情 -> GET /api/v1/admin/support/messages/:id
    @Get('messages/:id')
    async getAdminMessageDetail(@Param('id', ParseIntPipe) id: number) {
        return await this.supportService.getMessageById(id);
    }

    // 更新留言处理状态 -> PATCH /api/v1/admin/support/messages/:id/status
    @Patch('messages/:id/status')
    async updateMessageStatus(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateMessageStatusDto, // 使用 DTO 替代原始状态枚举，触发 ValidationPipe 校验
    ) {
        return await this.supportService.updateMessageStatus(id, body.status);
    }

    // 创建 FAQ -> POST /api/v1/admin/support/faqs
    @Post('faqs')
    @HttpCode(HttpStatus.CREATED)
    async createFaq(@Body() body: CreateFaqDto) {
        return await this.supportService.createFaq(body);
    }

    // 更新 FAQ -> PATCH /api/v1/admin/support/faqs/:id
    @Patch('faqs/:id')
    async updateFaq(
        @Param('id', ParseIntPipe) id: number,
        @Body() body: UpdateFaqDto,
    ) {
        return await this.supportService.updateFaq(id, body);
    }

    // 删除 FAQ -> DELETE /api/v1/admin/support/faqs/:id
    @Delete('faqs/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteFaq(@Param('id', ParseIntPipe) id: number) {
        await this.supportService.deleteFaq(id);
    }
}