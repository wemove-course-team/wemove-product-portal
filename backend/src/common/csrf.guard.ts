import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Request } from 'express'

/**
 * CSRF 双提交校验（#85 契约 v1 / 决策 D4）：
 * GET /auth/csrf 下发 token（写入 Cookie `wemove_csrf` 并随响应体返回），
 * 所有写请求必须携带与 Cookie 一致的 X-CSRF-Token 头。
 *
 * 前端 services/http.js 已实现自动预取与附带；本地脚本联调请先 GET /auth/csrf。
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>()
    const method = (req.method || '').toUpperCase()
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true

    const cookieToken = req.cookies?.['wemove_csrf']
    const headerToken = req.headers['x-csrf-token']
    const header = Array.isArray(headerToken) ? headerToken[0] : headerToken
    if (!cookieToken || !header || cookieToken !== header) {
      throw new ForbiddenException('会话校验失败，请刷新页面后重试')
    }
    return true
  }
}
