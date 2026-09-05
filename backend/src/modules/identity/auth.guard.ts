import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common'
import { AuthenticatedRequest } from './auth.types'
import { SessionService } from './session.service'

@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private readonly sessions: SessionService) {}
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>()
    const user = this.sessions.get(request.cookies?.wemove_session)
    if (!user || user.status !== 1) throw new UnauthorizedException({ code: 'AUTH_401', message: '请先登录' })
    request.user = user
    return true
  }
}
