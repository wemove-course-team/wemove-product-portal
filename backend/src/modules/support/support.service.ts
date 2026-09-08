import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import {
    SupportMessage,
    SupportFaq,
    SupportManual,
    MessageStatus,
    ManualVisibility,
} from './support.entity';

export interface CreateMessageDto {
    name: string;
    email: string;
    subject: string;
    content: string;
}

export interface CreateFaqDto {
    category: string;
    question: string;
    answer: string;
    sortOrder?: number;
    isPublished?: boolean;
}

@Injectable()
export class SupportService {
    constructor(
        @InjectRepository(SupportMessage)
        private readonly messageRepo: Repository<SupportMessage>,
        @InjectRepository(SupportFaq)
        private readonly faqRepo: Repository<SupportFaq>,
        @InjectRepository(SupportManual)
        private readonly manualRepo: Repository<SupportManual>,
    ) { }

    // --- 1. 联系留言 ---

    async createMessage(dto: CreateMessageDto): Promise<SupportMessage> {
        const ticketNo = `TK${Date.now()}${Math.floor(Math.random() * 1000)}`;
        const msg = this.messageRepo.create({
            ...dto,
            ticketNo,
            status: MessageStatus.PENDING,
        });
        return await this.messageRepo.save(msg);
    }

    async getMessages(page = 1, pageSize = 10, status?: MessageStatus) {
        const where = status ? { status } : {};
        const [items, total] = await this.messageRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * pageSize,
            take: pageSize,
        });
        return { items, total, page, pageSize };
    }

    async getMessageById(id: number): Promise<SupportMessage> {
        const msg = await this.messageRepo.findOne({ where: { id } });
        if (!msg) {
            throw new NotFoundException(`Message with ID ${id} not found`);
        }
        return msg;
    }

    async updateMessageStatus(id: number, status: MessageStatus): Promise<SupportMessage> {
        const msg = await this.getMessageById(id);
        msg.status = status;
        return await this.messageRepo.save(msg);
    }

    // --- 2. FAQ ---

    async getPublicFaqs(category?: string, keyword?: string): Promise<SupportFaq[]> {
        const query = this.faqRepo.createQueryBuilder('faq')
            .where('faq.is_published = :isPublished', { isPublished: true });

        if (category) {
            query.andWhere('faq.category = :category', { category });
        }

        if (keyword) {
            query.andWhere('(faq.question LIKE :keyword OR faq.answer LIKE :keyword)', {
                keyword: `%${keyword}%`,
            });
        }

        return await query.orderBy('faq.sort_order', 'ASC').getMany();
    }

    async createFaq(dto: CreateFaqDto): Promise<SupportFaq> {
        const faq = this.faqRepo.create(dto);
        return await this.faqRepo.save(faq);
    }

    async updateFaq(id: number, dto: Partial<CreateFaqDto>): Promise<SupportFaq> {
        const faq = await this.faqRepo.findOne({ where: { id } });
        if (!faq) {
            throw new NotFoundException(`FAQ with ID ${id} not found`);
        }
        Object.assign(faq, dto);
        return await this.faqRepo.save(faq);
    }

    async deleteFaq(id: number): Promise<void> {
        const result = await this.faqRepo.delete(id);
        if (result.affected === 0) {
            throw new NotFoundException(`FAQ with ID ${id} not found`);
        }
    }

    // --- 3. 下载与说明书 ---

    async getPublicManuals(authHeader?: string): Promise<SupportManual[]> {
        // 简易权限判定：无 authHeader 为 PUBLIC；后续配合 MVP-01 可解析 Token 区分 USER / DEALER
        const allowVisibilities = [ManualVisibility.PUBLIC];
        if (authHeader) {
            allowVisibilities.push(ManualVisibility.USER, ManualVisibility.DEALER);
        }

        return await this.manualRepo.createQueryBuilder('manual')
            .where('manual.is_published = :isPublished', { isPublished: true })
            .andWhere('manual.visibility IN (:...visibilities)', { visibilities: allowVisibilities })
            .getMany();
    }

    async checkManualAccess(id: number, isAuthenticated: boolean): Promise<{ allowed: boolean }> {
        const manual = await this.manualRepo.findOne({ where: { id } });
        if (!manual) {
            throw new NotFoundException(`Manual with ID ${id} not found`);
        }

        if (manual.visibility !== ManualVisibility.PUBLIC && !isAuthenticated) {
            return { allowed: false };
        }
        return { allowed: true };
    }
}