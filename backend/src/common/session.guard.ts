import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { DataSource } from 'typeorm'
import { Request } from 'express'

/**
 * 会话守卫（#85 契约 v1）：解析 HttpOnly Cookie `wemove_session` 中的签名 JWT，
 * 并每请求查库校验用户 status —— 停用用户即使持有效会话也立即失效（#85 验收项）。
 *
 * 用法：@UseGuards(SessionGuard, RolesGuard) + @Roles('ADMIN')
 * 公开接口需要“可选会话”（如经销商价裁剪）时使用 OptionalSessionGuard。
 */
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const token = req.cookies?.['wemove_session']
    if (!token) {
      throw new UnauthorizedException('请先登录')
    }

    let payload: { sub?: string }
    try {
      payload = await this.jwtService.verifyAsync(token)
    } catch {
      throw new UnauthorizedException('登录状态已失效，请重新登录')
    }

    const userId = payload?.sub
    if (!userId) {
      throw new UnauthorizedException('登录状态已失效，请重新登录')
    }

    const rows: Array<{
      id: string
      username: string
      email: string
      role: string
      company_id: string | null
      status: number
    }> = await this.dataSource.query(
      'SELECT id, username, email, role, company_id, status FROM sys_user WHERE id = ? LIMIT 1',
      [userId]
    )
    const user = rows[0]
    if (!user || Number(user.status) !== 1) {
      throw new UnauthorizedException('账号不可用或已被停用')
    }

    req.user = {
      id: String(user.id),
      username: user.username,
      email: user.email,
      role: user.role as 'GUEST' | 'USER' | 'DEALER' | 'ADMIN',
      companyId: user.company_id == null ? null : String(user.company_id)
    }
    return true
  }
}
