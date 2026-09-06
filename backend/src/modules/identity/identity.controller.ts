import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, Put, Req, Res, UseGuards } from '@nestjs/common'
import { Response } from 'express'
import { randomUUID } from 'crypto'
import { CsrfGuard } from '../../common/csrf.guard'
import { CurrentUser } from '../../common/current-user.decorator'
import { RequestUser } from '../../common/request-user'
import { SessionGuard } from '../../common/session.guard'
import { ChangePasswordDto, ConfirmPasswordResetDto, LoginDto, RegisterDto, RequestPasswordResetDto, UpdateProfileDto } from './identity.dto'
import { IdentityService } from './identity.service'

@Controller()
export class IdentityController {
  constructor(private readonly identity: IdentityService) {}

  @Get('auth/csrf')
  issueCsrf(@Res({ passthrough: true }) response: Response) {
    const token = randomUUID()
    response.cookie('wemove_csrf', token, { httpOnly: false, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
    return { csrfToken: token }
  }

  @Post('auth/register')
  @HttpCode(HttpStatus.OK)
  register(@Body() body: RegisterDto) { return this.identity.register(body) }

  @Post('auth/login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) {
    const { token, user } = await this.identity.authenticate(body.identifier, body.password)
    response.cookie('wemove_session', token, { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/' })
    return user
  }

  @Post('auth/logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  logout(@Res({ passthrough: true }) response: Response) {
    response.clearCookie('wemove_session', { secure: process.env.NODE_ENV === 'production', path: '/' })
    return undefined
  }

  @Get('auth/me')
  @UseGuards(SessionGuard)
  me(@CurrentUser() user: RequestUser) { return this.identity.getById(user.id).then((entity) => this.identity.toSummary(entity)) }

  @Patch('users/me')
  @UseGuards(SessionGuard)
  updateProfile(@CurrentUser() user: RequestUser, @Body() body: UpdateProfileDto) { return this.identity.updateProfile(user.id, body) }

  @Put('users/me/password')
  @UseGuards(SessionGuard)
  changePassword(@CurrentUser() user: RequestUser, @Body() body: ChangePasswordDto) { return this.identity.changePassword(user.id, body) }

  @Post('auth/password-reset/request')
  @HttpCode(HttpStatus.OK)
  requestPasswordReset(@Body() body: RequestPasswordResetDto) { return this.identity.requestPasswordReset(body.email) }

  @Post('auth/password-reset/confirm')
  @HttpCode(HttpStatus.OK)
  confirmPasswordReset(@Body() body: ConfirmPasswordResetDto) { return this.identity.confirmPasswordReset(body) }
}
