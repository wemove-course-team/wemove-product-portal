import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { DataSource } from 'typeorm'
import { Request } from 'express'

/**
 * 可选会话守卫：与 SessionGuard 相同的解析逻辑，但未登录/会话失效时静默放行
 * （req.user 不挂载，按游客处理）。
 *
 * 用于公开产品接口：登录的经销商/管理员可见 dealerPrice/moq（DTO 按角色裁剪），
 * 游客与普通用户永不可见 —— 裁剪由服务端完成，前端只渲染 API 返回的字段。
 */
@Injectable()
export class OptionalSessionGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest<Request>()
    const token = req.cookies?.['wemove_session']
    if (!token) return true

    try {
      const payload = await this.jwtService.verifyAsync(token)
      if (payload?.sub) {
        const rows: Array<{
          id: string
          username: string
          email: string
          role: string
          company_id: string | null
          status: number
        }> = await this.dataSource.query(
          'SELECT id, username, email, role, company_id, status FROM sys_user WHERE id = ? LIMIT 1',
          [payload.sub]
        )
        const user = rows[0]
        if (user && Number(user.status) === 1) {
          req.user = {
            id: String(user.id),
            username: user.username,
            email: user.email,
            role: user.role as 'GUEST' | 'USER' | 'DEALER' | 'ADMIN',
            companyId: user.company_id == null ? null : String(user.company_id)
          }
        }
      }
    } catch {
      // 会话无效一律按游客处理，公开接口不因坏 Cookie 报 401
    }
    return true
  }
}
