import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'crypto'
import { DataSource, Repository } from 'typeorm'
import { User } from '../identity/user.entity'
import { CreateDealerApplicationDto, DealerApplicationQueryDto, ReviewDealerApplicationDto } from './dealer.dto'
import { DealerApplication } from './dealer-application.entity'
import { DealerCompany } from './dealer-company.entity'

@Injectable()
export class DealerService {
  constructor(
    @InjectRepository(DealerApplication) private readonly applications: Repository<DealerApplication>,
    @InjectRepository(DealerCompany) private readonly companies: Repository<DealerCompany>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly dataSource: DataSource
  ) {}

  async create(user: User, input: CreateDealerApplicationDto) {
    return this.dataSource.transaction(async (manager) => {
      const userRepo = manager.getRepository(User)
      const applicationRepo = manager.getRepository(DealerApplication)
      const userId = Number(user.id)

      // 锁住用户行，串行化同一用户的并发申请检查。
      const lockedUser = await userRepo.findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' }
      })
      if (!lockedUser) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '用户不存在' })

      const active = await applicationRepo.findOne({
        where: [
          { userId, status: 'PENDING' },
          { userId, status: 'APPROVED' }
        ]
      })
      if (active) {
        throw new ConflictException({ code: 'CONFLICT_409', message: '您已有待审核或已通过的经销商申请' })
      }

      const application = applicationRepo.create({
        ...input,
        email: input.email.toLowerCase(),
        userId,
        id: this.nextId(),
        status: 'PENDING',
        tierName: null,
        discountRate: null,
        auditNote: null,
        auditedAt: null
      })
      return this.serialize(await applicationRepo.save(application))
    })
  }

  async mine(user: User) {
    const items = await this.applications.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' }
    })
    return items.map((item) => this.serialize(item))
  }

  async list(query: DealerApplicationQueryDto) {
    const page = Math.max(1, Math.floor(Number(query.page) || 1))
    const pageSize = Math.min(50, Math.max(1, Math.floor(Number(query.pageSize) || 10)))
    const builder = this.applications
      .createQueryBuilder('application')
      .orderBy('application.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize)

    if (query.status) {
      builder.andWhere('application.status = :status', { status: query.status })
    }

    const [items, total] = await builder.getManyAndCount()
    return { items: items.map((item) => this.serialize(item)), total, page, pageSize }
  }

  async review(id: string, input: ReviewDealerApplicationDto) {
    return this.dataSource.transaction(async (manager) => {
      const applicationRepo = manager.getRepository(DealerApplication)
      const companyRepo = manager.getRepository(DealerCompany)
      const userRepo = manager.getRepository(User)
      const application = await applicationRepo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' }
      })

      if (!application) {
        throw new NotFoundException({ code: 'NOT_FOUND_404', message: '经销商申请不存在' })
      }
      if (application.status !== 'PENDING') {
        throw new ConflictException({ code: 'CONFLICT_409', message: '只有待审核申请可以审核' })
      }

      application.status = input.action
      application.auditNote = input.auditNote
      application.auditedAt = new Date()

      if (input.action === 'REJECTED') {
        return this.serialize(await applicationRepo.save(application))
      }
      if (application.userId == null) {
        throw new ConflictException({ code: 'CONFLICT_409', message: '申请未绑定登录用户，无法授予经销商身份' })
      }

      const tierName = input.tierName?.trim() || '二级特约经销商'
      const discountRate = input.discountRate ?? 0.75
      application.tierName = tierName
      application.discountRate = discountRate

      let company = await companyRepo.findOne({ where: { taxId: application.taxId } })
      if (!company) {
        company = companyRepo.create({
          companyName: application.companyName,
          taxId: application.taxId,
          businessType: application.businessType,
          region: application.region,
          tierName,
          discountRate,
          contactName: application.contactName,
          contactPhone: application.phone,
          contactEmail: application.email,
          status: 'ACTIVE'
        })
      } else {
        Object.assign(company, {
          companyName: application.companyName,
          businessType: application.businessType,
          region: application.region,
          tierName,
          discountRate,
          contactName: application.contactName,
          contactPhone: application.phone,
          contactEmail: application.email,
          status: 'ACTIVE'
        })
      }
      company = await companyRepo.save(company)
      await userRepo.update(
        { id: application.userId },
        { role: 'DEALER', companyId: company.id }
      )
      await applicationRepo.save(application)
      return this.serialize(application)
    })
  }

  async portal(user: User) {
    if (user.role !== 'DEALER' && user.role !== 'ADMIN') {
      throw new ForbiddenException({ code: 'FORBIDDEN_403', message: '您还不是经销商成员' })
    }

    const applications = await this.applications.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' }
    })
    const company = user.companyId
      ? await this.companies.findOne({ where: { id: user.companyId } })
      : null

    return {
      company: company
        ? {
            id: String(company.id),
            companyName: company.companyName,
            region: company.region,
            tierName: company.tierName,
            discountRate: Number(company.discountRate),
            contactName: company.contactName,
            contactPhone: company.contactPhone,
            contactEmail: company.contactEmail,
            status: company.status
          }
        : null,
      applications: applications.map((item) => this.serialize(item))
    }
  }

  private nextId() {
    const now = new Date()
    const suffix = randomUUID().replaceAll('-', '').slice(0, 23)
    return `APP-${now.getFullYear()}-${suffix}`
  }

  private serialize(application: DealerApplication) {
    return {
      id: application.id,
      userId: application.userId == null ? null : String(application.userId),
      companyName: application.companyName,
      taxId: application.taxId,
      businessType: application.businessType,
      region: application.region,
      contactName: application.contactName,
      phone: application.phone,
      email: application.email,
      annualTarget: application.annualTarget,
      salesChannels: application.salesChannels || '',
      status: application.status,
      tierName: application.tierName,
      discountRate: application.discountRate == null ? null : Number(application.discountRate),
      auditNote: application.auditNote,
      auditedAt: application.auditedAt,
      createdAt: application.createdAt
    }
  }
}
