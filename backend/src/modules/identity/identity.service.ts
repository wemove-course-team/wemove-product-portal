import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import { createHash, randomBytes } from 'crypto'
import * as bcrypt from 'bcryptjs'
import { IsNull, Repository } from 'typeorm'
import { DataSource } from 'typeorm'
import { PasswordResetToken } from './password-reset-token.entity'
import { User } from './user.entity'
import { AdminUserQueryDto, ChangePasswordDto, ConfirmPasswordResetDto, RegisterDto, UpdateProfileDto } from './identity.dto'

@Injectable()
export class IdentityService {
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(PasswordResetToken) private readonly resetTokens: Repository<PasswordResetToken>,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly dataSource: DataSource
  ) {}

  async register(input: RegisterDto) {
    const existing = await this.users.findOne({ where: [{ username: input.username }, { email: input.email }] })
    if (existing) throw new ConflictException({ code: 'CONFLICT_409', message: '用户名或邮箱已存在' })
    const user = this.users.create({
      username: input.username,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 10),
      role: 'USER',
      status: 1,
      realName: null,
      phone: null,
      companyId: null
    })
    return this.toSummary(await this.users.save(user))
  }

  async authenticate(identifier: string, password: string) {
    const user = await this.users.findOne({ where: [{ username: identifier }, { email: identifier.toLowerCase() }] })
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException({ code: 'AUTH_401', message: '账号或密码不正确' })
    }
    if (Number(user.status) !== 1) throw new UnauthorizedException({ code: 'AUTH_401', message: '账号已被停用，请联系管理员' })
    const token = await this.jwt.signAsync({ sub: String(user.id), role: user.role }, { expiresIn: this.config.get('JWT_EXPIRES_IN', '7d') })
    return { token, user: this.toSummary(user) }
  }

  async getById(id: string) {
    const user = await this.users.findOne({ where: { id: Number(id) } })
    if (!user || Number(user.status) !== 1) throw new UnauthorizedException({ code: 'AUTH_401', message: '登录状态已失效，请重新登录' })
    return user
  }

  async updateProfile(userId: string, input: UpdateProfileDto) {
    const user = await this.getById(userId)
    Object.assign(user, input)
    return this.toSummary(await this.users.save(user))
  }

  async changePassword(userId: string, input: ChangePasswordDto) {
    const user = await this.getById(userId)
    if (!(await bcrypt.compare(input.oldPassword, user.passwordHash))) {
      throw new UnauthorizedException({ code: 'AUTH_401', message: '当前密码不正确' })
    }
    user.passwordHash = await bcrypt.hash(input.newPassword, 10)
    await this.users.save(user)
    return { changed: true }
  }

  async requestPasswordReset(email: string) {
    const user = await this.users.findOne({ where: { email: email.toLowerCase() } })
    // Do not reveal whether an email is registered.
    if (!user) return { accepted: true }
    await this.resetTokens.update({ userId: user.id, usedAt: IsNull() }, { usedAt: new Date() })
    const rawToken = randomBytes(32).toString('hex')
    const token = this.resetTokens.create({
      userId: user.id,
      tokenHash: this.hashToken(rawToken),
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
      usedAt: null
    })
    await this.resetTokens.save(token)
    // The course flow intentionally uses the dev log instead of an email provider.
    console.log(`[identity] password reset token for ${user.email}: ${rawToken}`)
    return { accepted: true }
  }

  async confirmPasswordReset(input: ConfirmPasswordResetDto) {
    const tokenHash = this.hashToken(input.token)
    // Token claim, password update and usedAt mark share one transaction and row lock.
    return this.dataSource.transaction(async (manager) => {
      const tokenRepo = manager.getRepository(PasswordResetToken)
      const userRepo = manager.getRepository(User)
      const token = await tokenRepo.findOne({
        where: { tokenHash },
        lock: { mode: 'pessimistic_write' }
      })
      if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) {
        throw new UnauthorizedException({ code: 'AUTH_401', message: '重置 token 无效或已过期' })
      }
      const user = await userRepo.findOne({ where: { id: token.userId } })
      if (!user || Number(user.status) !== 1) {
        throw new UnauthorizedException({ code: 'AUTH_401', message: '登录状态已失效，请重新登录' })
      }
      user.passwordHash = await bcrypt.hash(input.newPassword, 10)
      token.usedAt = new Date()
      await userRepo.save(user)
      await tokenRepo.save(token)
      return { changed: true }
    })
  }

  async listUsers(query: AdminUserQueryDto) {
    const page = Math.max(1, Number(query.page) || 1)
    const pageSize = Math.min(50, Math.max(1, Number(query.pageSize) || 10))
    const builder = this.users.createQueryBuilder('user').select(['user.id', 'user.username', 'user.realName', 'user.email', 'user.phone', 'user.role', 'user.companyId', 'user.status', 'user.createdAt']).orderBy('user.createdAt', 'DESC')
    if (query.keyword) builder.andWhere('(user.username LIKE :keyword OR user.email LIKE :keyword OR user.realName LIKE :keyword)', { keyword: `%${query.keyword}%` })
    if (query.status !== undefined) builder.andWhere('user.status = :status', { status: Number(query.status) })
    const [items, total] = await builder.skip((page - 1) * pageSize).take(pageSize).getManyAndCount()
    return { items: items.map((user) => this.toSummary(user, true)), total, page, pageSize }
  }

  async updateUserStatus(id: string, status: 0 | 1, actorId?: string) {
    const user = await this.users.findOne({ where: { id: Number(id) } })
    if (!user) throw new NotFoundException({ code: 'NOT_FOUND_404', message: '用户不存在' })
    if (status === 0 && actorId && String(user.id) === String(actorId)) {
      throw new ConflictException({ code: 'CONFLICT_409', message: '不能停用当前管理员账号' })
    }
    if (status === 0 && user.role === 'ADMIN') {
      const activeAdmins = await this.users.count({ where: { role: 'ADMIN', status: 1 } })
      if (activeAdmins <= 1) {
        throw new ConflictException({ code: 'CONFLICT_409', message: '不能停用最后一个有效管理员' })
      }
    }
    user.status = status
    return this.toSummary(await this.users.save(user), true)
  }

  toSummary(user: User, includeStatus = false) {
    return {
      id: String(user.id),
      username: user.username,
      email: user.email,
      realName: user.realName,
      phone: user.phone,
      role: user.role,
      companyId: user.companyId == null ? null : String(user.companyId),
      ...(includeStatus ? { status: Number(user.status), createdAt: user.createdAt } : {})
    }
  }

  private hashToken(token: string) { return createHash('sha256').update(token).digest('hex') }
}
