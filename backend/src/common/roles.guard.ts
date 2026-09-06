import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { Request } from 'express'

export const ROLES_KEY = 'wemove_roles'

/**
 * 角色声明装饰器，配合 RolesGuard 使用：
 *   @UseGuards(SessionGuard, RolesGuard)
 *   @Roles('ADMIN')
 */
export function Roles(...roles: string[]) {
  return (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor): void => {
    if (descriptor?.value) {
      Reflect.defineMetadata(ROLES_KEY, roles, descriptor.value)
    } else {
      Reflect.defineMetadata(ROLES_KEY, roles, target)
    }
  }
}

/** 角色裁决守卫：仅做“已登录用户是否具备声明角色”的判断（登录态由 SessionGuard 保证） */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<string[] | undefined>(ROLES_KEY, [
      context.getHandler(),
      context.getClass()
    ])
    if (!required || required.length === 0) return true

    const req = context.switchToHttp().getRequest<Request>()
    if (!req.user) {
      throw new ForbiddenException('您没有权限执行此操作')
    }
    if (!required.includes(req.user.role)) {
      throw new ForbiddenException('您没有权限执行此操作')
    }
    return true
  }
}
