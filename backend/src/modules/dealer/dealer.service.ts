import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { DataSource, Repository } from 'typeorm'
import { DealerApplication } from './dealer-application.entity'
import { DealerCompany } from './dealer-company.entity'
import { User } from '../identity/user.entity'
import { SessionService } from '../identity/session.service'
import { CreateDealerApplicationDto, ReviewDealerApplicationDto } from './dealer.dto'

@Injectable()
export class DealerService {
  constructor(@InjectRepository(DealerApplication) private readonly applications: Repository<DealerApplication>, @InjectRepository(DealerCompany) private readonly companies: Repository<DealerCompany>, @InjectRepository(User) private readonly users: Repository<User>, private readonly dataSource: DataSource, private readonly sessions: SessionService) {}
  private nextId() { const now = new Date(); return `APP-${now.getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}` }
  private serialize(application: DealerApplication) { return { id: application.id, userId: application.userId == null ? null : String(application.userId), companyName: application.companyName, taxId: application.taxId, businessType: application.businessType, region: application.region, contactName: application.contactName, phone: application.phone, email: application.email, annualTarget: application.annualTarget, salesChannels: application.salesChannels || '', status: application.status, tierName: application.tierName, discountRate: application.discountRate == null ? null : Number(application.discountRate), auditNote: application.auditNote, auditedAt: application.auditedAt, createdAt: application.createdAt } }
  async create(user: User, input: CreateDealerApplicationDto) {
    const active = await this.applications.findOne({ where: [{ userId: user.id, status: 'PENDING' }, { userId: user.id, status: 'APPROVED' }] })
    if (active) throw new ConflictException({ code: 'CONFLICT_409', message: '您已有待审核或已通过的经销商申请' })
    const application = this.applications.create({ ...input, userId: user.id, id: this.nextId(), status: 'PENDING', tierName: null, discountRate: null, auditNote: null, auditedAt: null })
    return this.serialize(await this.applications.save(application))
  }
  async mine(user: User) { return (await this.applications.find({ where: { userId: user.id }, order: { createdAt: 'DESC' } })).map((item) => this.serialize(item)) }
  async list(status?: string, page = 1, pageSize = 10) {
    const safePage = Math.max(1, Number(page) || 1), safePageSize = Math.min(50, Math.max(1, Number(pageSize) || 10))
    const query = this.applications.createQueryBuilder('application').orderBy('application.created_at', 'DESC').skip((safePage - 1) * safePageSize).take(safePageSize)
    if (status) query.where('application.status = :status', { status })
    const [items, total] = await query.getManyAndCount()
    return { items: items.map((item) => this.serialize(item)), total, page: safePage, pageSize: safePageSize }
  }
  async review(id: string, input: ReviewDealerApplicationDto) {
    return this.dataSource.transaction(async (manager) => {
      const application = await manager.getRepository(DealerApplication).findOne({ where: { id } })
      if (!application) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '经销商申请不存在' })
      if (application.status !== 'PENDING') throw new ConflictException({ code: 'CONFLICT_409', message: '只有待审核申请可以审核' })
      application.status = input.action; application.auditNote = input.auditNote; application.auditedAt = new Date()
      if (input.action === 'REJECTED') return this.serialize(await manager.getRepository(DealerApplication).save(application))
      const tierName = input.tierName || '二级特约经销商', discountRate = input.discountRate == null ? 0.75 : Number(input.discountRate)
      application.tierName = tierName; application.discountRate = discountRate
      let company = await manager.getRepository(DealerCompany).findOne({ where: { taxId: application.taxId } })
      if (!company) company = manager.getRepository(DealerCompany).create({ companyName: application.companyName, taxId: application.taxId, businessType: application.businessType, region: application.region, tierName, discountRate, contactName: application.contactName, contactPhone: application.phone, contactEmail: application.email, status: 'ACTIVE' })
      else Object.assign(company, { companyName: application.companyName, businessType: application.businessType, region: application.region, tierName, discountRate, contactName: application.contactName, contactPhone: application.phone, contactEmail: application.email, status: 'ACTIVE' })
      company = await manager.getRepository(DealerCompany).save(company)
      if (application.userId == null) throw new ConflictException({ code: 'CONFLICT_409', message: '申请未绑定登录用户，无法授予经销商身份' })
      await manager.getRepository(User).update({ id: application.userId as any }, { role: 'DEALER', companyId: company.id })
      this.sessions.refreshUser(application.userId, { role: 'DEALER', companyId: company.id })
      return this.serialize(await manager.getRepository(DealerApplication).save(application))
    })
  }
  async portal(user: User) {
    if (user.role !== 'DEALER' && user.role !== 'ADMIN') throw new ForbiddenException({ code: 'FORBIDDEN_403', message: '您还不是经销商成员' })
    const applications = await this.applications.find({ where: { userId: user.id }, order: { createdAt: 'DESC' } })
    const company = user.companyId ? await this.companies.findOne({ where: { id: user.companyId } }) : null
    return { company: company ? { id: String(company.id), companyName: company.companyName, region: company.region, tierName: company.tierName, discountRate: Number(company.discountRate), contactName: company.contactName, contactPhone: company.contactPhone, contactEmail: company.contactEmail, status: company.status } : null, applications: applications.map((item) => this.serialize(item)) }
  }
}
