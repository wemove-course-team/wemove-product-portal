import { Body, ConflictException, Controller, Get, Headers, HttpCode, HttpStatus, Injectable, Module, Post, Req, Res, UnauthorizedException } from '@nestjs/common'
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm'
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator'
import { Request, Response } from 'express'
import * as bcrypt from 'bcryptjs'
import { ok } from '../../common/api-envelope'
import { User } from './user.entity'
import { SessionService } from './session.service'

export class RegisterDto { @IsString() @IsNotEmpty() username!: string; @IsEmail() email!: string; @IsString() @MinLength(6) password!: string }
export class LoginDto { @IsString() @IsNotEmpty() identifier!: string; @IsString() @IsNotEmpty() password!: string }

@Injectable()
export class AuthService {
  constructor(@InjectRepository(User) private readonly users: any, private readonly sessions: SessionService) {}
  async register(input: RegisterDto) {
    const exists = await this.users.findOne({ where: [{ username: input.username }, { email: input.email }] })
    if (exists) throw new ConflictException({ code: 'CONFLICT_409', message: '用户名或邮箱已存在' })
    const user = this.users.create({ username: input.username, email: input.email, passwordHash: await bcrypt.hash(input.password, 10), role: 'USER', status: 1 })
    return this.publicUser(await this.users.save(user))
  }
  async login(input: LoginDto) {
    const user = await this.users.findOne({ where: [{ username: input.identifier }, { email: input.identifier }] })
    if (!user || user.status !== 1 || !(await bcrypt.compare(input.password, user.passwordHash))) throw new UnauthorizedException({ code: 'AUTH_401', message: '用户名或密码错误' })
    return { token: this.sessions.create(user), user: this.publicUser(user) }
  }
  publicUser(user: User) { return { id: String(user.id), username: user.username, email: user.email, role: user.role, companyId: user.companyId == null ? null : String(user.companyId), realName: user.realName, phone: user.phone } }
}
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService, private readonly sessions: SessionService) {}
  @Get('csrf') csrf(@Headers('x-csrf-token') token?: string) { return ok({ csrfToken: token || 'dev-csrf-token' }) }
  @Post('register') register(@Body() body: RegisterDto) { return this.auth.register(body).then((data) => ok(data, '注册成功')) }
  @Post('login') login(@Body() body: LoginDto, @Res({ passthrough: true }) response: Response) { return this.auth.login(body).then(({ token, user }) => { response.cookie('wemove_session', token, { httpOnly: true, sameSite: 'lax' }); return ok(user, '登录成功') }) }
  @Get('me') me(@Req() request: Request) { const user = this.sessions.get(request.cookies?.wemove_session); if (!user) throw new UnauthorizedException({ code: 'AUTH_401', message: '请先登录' }); return ok(this.auth.publicUser(user)) }
  @Post('logout') @HttpCode(HttpStatus.NO_CONTENT) logout(@Req() request: Request, @Res({ passthrough: true }) response: Response) { this.sessions.remove(request.cookies?.wemove_session); response.clearCookie('wemove_session'); return undefined }
}

@Module({ imports: [TypeOrmModule.forFeature([User])], controllers: [AuthController], providers: [AuthService, SessionService], exports: [SessionService, AuthService, TypeOrmModule] })
export class AuthModule {}
