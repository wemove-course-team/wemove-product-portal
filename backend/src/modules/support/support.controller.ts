import {
    Controller,
    Post,
    Get,
    Patch,
    Delete,
    Body,
    Param,
    Query,
    Headers,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { SupportService, CreateMessageDto, CreateFaqDto } from './support.service';
import { MessageStatus } from './support.entity';

@Controller('api/v1/support')
export class SupportController {
    constructor(private readonly supportService: SupportService) { }

    // --- 1. 联系留言 ---

    @Post('messages')
    @HttpCode(HttpStatus.CREATED)
    async submitMessage(@Body() body: CreateMessageDto) {
        return await this.supportService.createMessage(body);
    }

    @Get('admin/messages')
    async getAdminMessages(
        @Query('page') page = 1,
        @Query('limit') limit = 10,
        @Query('status') status?: MessageStatus,
    ) {
        return await this.supportService.getMessages(+page, +limit, status);
    }

    @Get('admin/messages/:id')
    async getAdminMessageDetail(@Param('id') id: string) {
        return await this.supportService.getMessageById(id);
    }

    @Patch('admin/messages/:id/status')
    async updateMessageStatus(
        @Param('id') id: string,
        @Body('status') status: MessageStatus,
    ) {
        return await this.supportService.updateMessageStatus(id, status);
    }

    // --- 2. FAQ ---

    @Get('faqs')
    async getPublicFaqs(
        @Query('category') category?: string,
        @Query('search') search?: string,
    ) {
        return await this.supportService.getPublicFaqs(category, search);
    }

    @Post('admin/faqs')
    @HttpCode(HttpStatus.CREATED)
    async createFaq(@Body() body: CreateFaqDto) {
        return await this.supportService.createFaq(body);
    }

    @Patch('admin/faqs/:id')
    async updateFaq(
        @Param('id') id: string,
        @Body() body: Partial<CreateFaqDto>,
    ) {
        return await this.supportService.updateFaq(id, body);
    }

    @Delete('admin/faqs/:id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteFaq(@Param('id') id: string) {
        await this.supportService.deleteFaq(id);
    }

    // --- 3. 下载与说明书 ---

    @Get('manuals')
    async getPublicManuals() {
        return await this.supportService.getPublicManuals();
    }

    @Get('manuals/:id/access')
    async checkManualAccess(
        @Param('id') id: string,
        @Headers('authorization') authHeader?: string,
    ) {
        const isAuthenticated = Boolean(authHeader && authHeader.startsWith('Bearer '));
        return await this.supportService.checkManualAccess(id, isAuthenticated);
    }
}