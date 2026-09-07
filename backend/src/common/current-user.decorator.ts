import { createParamDecorator, ExecutionContext } from '@nestjs/common'
import type { RequestUser } from './request-user'

/** 读取守卫挂载到请求上的当前用户。 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RequestUser | null => {
    const req = ctx.switchToHttp().getRequest()
    return req.user ?? null
  }
)
