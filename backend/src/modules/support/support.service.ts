import {
    Injectable,
    ConflictException,
    NotFoundException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import {
    SupportMessage,
    SupportFaq,
    SupportManual,
    MessageStatus,
    ManualAccessLevel,
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

export interface CreateManualDto {
    title: string;
    description?: string;
    fileUrl: string;
    fileSize: number;
    accessLevel?: ManualAccessLevel;
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

    // --- 联系留言业务 ---

    async createMessage(dto: CreateMessageDto): Promise<SupportMessage> {
        const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
        const recentDuplicate = await this.messageRepo.createQueryBuilder('msg')
            .where('msg.email = :email', { email: dto.email })
            .andWhere('msg.content = :content', { content: dto.content })
            .andWhere('msg.createdAt >= :tenMinutesAgo', { tenMinutesAgo })
            .getOne();

        if (recentDuplicate) {
            throw new ConflictException('请勿重复提交相同的留言内容，请稍后再试。');
        }

        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomSuffix = Math.floor(1000 + Math.random() * 9000);
        const ticketNo = `MSG-${dateStr}${randomSuffix}`;

        const message = this.messageRepo.create({
            ...dto,
            ticketNo,
            status: MessageStatus.PENDING,
        });

        return await this.messageRepo.save(message);
    }

    async getMessages(page = 1, limit = 10, status?: MessageStatus) {
        const where: FindOptionsWhere<SupportMessage> = {};
        if (status) where.status = status;

        const [items, total] = await this.messageRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip: (page - 1) * limit,
            take: limit,
        });

        return { items, total, page, limit };
    }

    async getMessageById(id: string): Promise<SupportMessage> {
        const msg = await this.messageRepo.findOne({ where: { id } });
        if (!msg) throw new NotFoundException('未找到指定留言');
        return msg;
    }

    async updateMessageStatus(id: string, status: MessageStatus): Promise<SupportMessage> {
        const msg = await this.getMessageById(id);
        msg.status = status;
        return await this.messageRepo.save(msg);
    }

    // --- FAQ 业务 ---

    async getPublicFaqs(category?: string, search?: string) {
        const query = this.faqRepo.createQueryBuilder('faq')
            .where('faq.isPublished = :isPublished', { isPublished: true });

        if (category) {
            query.andWhere('faq.category = :category', { category });
        }

        if (search) {
            query.andWhere(
                '(faq.question LIKE :search OR faq.answer LIKE :search)',
                { search: `%${search}%` },
            );
        }

        return await query.orderBy('faq.sortOrder', 'ASC').addOrderBy('faq.createdAt', 'DESC').getMany();
    }

    async createFaq(dto: CreateFaqDto): Promise<SupportFaq> {
        const faq = this.faqRepo.create(dto);
        return await this.faqRepo.save(faq);
    }

    async updateFaq(id: string, dto: Partial<CreateFaqDto>): Promise<SupportFaq> {
        const faq = await this.faqRepo.findOne({ where: { id } });
        if (!faq) throw new NotFoundException('未找到指定 FAQ');
        Object.assign(faq, dto);
        return await this.faqRepo.save(faq);
    }

    async deleteFaq(id: string): Promise<void> {
        const result = await this.faqRepo.delete(id);
        if (result.affected === 0) throw new NotFoundException('未找到指定 FAQ');
    }

    // --- 下载与说明书业务 ---

    async getPublicManuals() {
        return await this.manualRepo.find({
            where: { isPublished: true },
            order: { createdAt: 'DESC' },
        });
    }

    async checkManualAccess(id: string, isAuthenticated: boolean) {
        const manual = await this.manualRepo.findOne({ where: { id } });
        if (!manual || !manual.isPublished) {
            throw new NotFoundException('文件不存在或已被下架');
        }

        if (manual.accessLevel === ManualAccessLevel.REGISTERED && !isAuthenticated) {
            throw new ForbiddenException('该文件需要登录后方可下载');
        }

        return {
            canAccess: true,
            downloadUrl: manual.fileUrl,
            title: manual.title,
        };
    }
}