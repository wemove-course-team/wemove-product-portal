import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { SessionGuard } from '../../common/session.guard'
import { CurrentUser } from '../../common/current-user.decorator'
import type { RequestUser } from '../../common/request-user'
import { IdentityService } from './identity.service'

/**
 * ⚠️ MVP-03 临时身份接口（供产品域联调与验收使用，正式实现以 #85 MVP-01 为准）
 *
 * 只实现冻结契约中产品域联调必需的四个端点：csrf / login / logout / me，
 * 响应形态与 frontend/src/services/contract-samples/auth.login.success.json 一致。
 * #85 合并时删除本模块（AppModule 内已标注替换点）。
 */
@Controller()
export class IdentityController {
  constructor(private readonly identityService: IdentityService) {}

  @Get('auth/csrf')
  issueCsrf(@Res({ passthrough: true }) res: Response) {
    return this.identityService.issueCsrf(res)
  }

  @Post('auth/login')
  async login(
    @Body() body: { identifier?: string; password?: string },
    @Res({ passthrough: true }) res: Response
  ) {
    const { token, user } = await this.identityService.authenticate(
      String(body.identifier ?? ''),
      String(body.password ?? '')
    )
    res.cookie('wemove_session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    })
    return user
  }

  @Post('auth/logout')
  logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('wemove_session', { path: '/' })
    return { ok: true }
  }

  @UseGuards(SessionGuard)
  @Get('auth/me')
  async me(@CurrentUser() user: RequestUser) {
    // SessionGuard 已完成解析/查库校验；再查一次库拿最新摘要（停用即时失效）
    return this.identityService.me(user.id)
  }
}
