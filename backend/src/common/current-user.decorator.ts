import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { RequestUser } from './request-user'

/** 取当前会话用户（SessionGuard / OptionalSessionGuard 解析后挂载，可能为 null） */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | null => {
    const req = ctx.switchToHttp().getRequest()
    return req.user ?? null
  }
)
