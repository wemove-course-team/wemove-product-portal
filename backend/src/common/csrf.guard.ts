import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Request } from 'express'

/** 校验写请求中的 CSRF Cookie 和请求头是否一致。 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>()
    const method = (req.method || '').toUpperCase()
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return true

    const cookieToken = req.cookies?.['wemove_csrf']
    const headerToken = req.headers['x-csrf-token']
    const header = Array.isArray(headerToken) ? headerToken[0] : headerToken
    if (process.env.CSRF_DEBUG) {
      console.log('[csrf-debug]', req.method, req.url, 'cookie=', req.cookies?.['wemove_csrf'], 'header=', header)
    }
    if (!cookieToken || !header || cookieToken !== header) {
      throw new ForbiddenException('会话校验失败，请刷新页面后重试')
    }
    return true
  }
}
