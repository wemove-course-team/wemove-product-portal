import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import { DataSource } from 'typeorm'
import { Request } from 'express'

/** 解析可选会话；没有有效会话时按游客继续访问公开接口。 */
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
      // 无效会话按游客处理，公开接口仍可访问。
    }
    return true
  }
}
