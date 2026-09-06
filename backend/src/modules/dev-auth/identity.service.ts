import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { DataSource } from 'typeorm'
import { Response } from 'express'
import { randomUUID } from 'crypto'
import * as bcrypt from 'bcryptjs'

interface DemoUserRow {
  id: string
  username: string
  email: string
  password_hash: string
  role: string
  company_id: string | null
  status: number
}

/**
 * ⚠️ MVP-03 临时身份服务（供产品域联调与验收使用，正式实现以 #85 MVP-01 为准）
 *
 * 仅实现冻结契约中联调必需的最小能力：
 * - GET /auth/csrf：CSRF 双提交 token（Cookie wemove_csrf + 响应体）
 * - POST /auth/login：username/email + bcrypt 密码 → HttpOnly Cookie 会话（wemove_session）
 * - GET /auth/me：SessionGuard 校验后的会话摘要
 * 会话 JWT 由 common/CommonModule 的 JwtModule 统一签发，SessionGuard 每请求查库校验 status。
 */
@Injectable()
export class IdentityService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService
  ) {}

  issueCsrf(res: Response) {
    const token = randomUUID()
    res.cookie('wemove_csrf', token, {
      httpOnly: false,
      sameSite: 'lax',
      path: '/'
    })
    return { csrfToken: token }
  }

  async authenticate(identifier: string, password: string) {
    if (!identifier || !password) {
      throw new UnauthorizedException('请输入登录名和密码')
    }
    const rows: DemoUserRow[] = await this.dataSource.query(
      'SELECT id, username, email, password_hash, role, company_id, status FROM sys_user WHERE username = ? OR email = ? LIMIT 1',
      [identifier, identifier]
    )
    const user = rows[0]
    if (!user) {
      throw new UnauthorizedException('账号或密码不正确')
    }

    const matched = await bcrypt.compare(password, user.password_hash)
    if (!matched) {
      throw new UnauthorizedException('账号或密码不正确')
    }
    if (Number(user.status) !== 1) {
      throw new UnauthorizedException('账号已被停用，请联系管理员')
    }

    const expiresIn = this.configService.get<string>('JWT_EXPIRES_IN', '7d')
    const token = await this.jwtService.signAsync({
      sub: String(user.id),
      role: user.role
    }, { expiresIn })

    return { token, user: this.toSummary(user) }
  }

  async me(userId: string) {
    const rows: DemoUserRow[] = await this.dataSource.query(
      'SELECT id, username, email, password_hash, role, company_id, status FROM sys_user WHERE id = ? LIMIT 1',
      [userId]
    )
    const user = rows[0]
    if (!user || Number(user.status) !== 1) {
      throw new UnauthorizedException('登录状态已失效，请重新登录')
    }
    return this.toSummary(user)
  }

  private toSummary(user: DemoUserRow) {
    return {
      id: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role,
      companyId: user.company_id == null ? null : String(user.company_id)
    }
  }
}
