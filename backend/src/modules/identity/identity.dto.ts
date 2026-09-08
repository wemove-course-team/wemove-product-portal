import { Type } from 'class-transformer'
import { IsEmail, IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength } from 'class-validator'

/** 注册参数。 */
export class RegisterDto {
  @IsString()
  @Matches(/^[A-Za-z0-9_]{3,32}$/, { message: '用户名需为 3-32 位字母、数字或下划线' })
  username!: string

  @IsEmail({}, { message: '请输入有效邮箱' })
  email!: string

  @IsString()
  @MinLength(8, { message: '密码至少 8 位' })
  @MaxLength(128, { message: '密码不能超过 128 位' })
  password!: string
}

/** 登录参数。 */
export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '请输入用户名或邮箱' })
  identifier!: string

  @IsString()
  @IsNotEmpty({ message: '请输入密码' })
  password!: string
}

/** 可修改的个人资料。 */
export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  realName?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string
}

/** 登录后修改密码的参数。 */
export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '请输入当前密码' })
  oldPassword!: string

  @IsString()
  @MinLength(8, { message: '新密码至少 8 位' })
  @MaxLength(128, { message: '新密码不能超过 128 位' })
  newPassword!: string
}

/** 找回密码申请参数。 */
export class RequestPasswordResetDto {
  @IsEmail({}, { message: '请输入有效邮箱' })
  email!: string
}

/** 确认密码重置的参数。 */
export class ConfirmPasswordResetDto {
  @IsString()
  @IsNotEmpty({ message: '请输入重置 token' })
  token!: string

  @IsString()
  @MinLength(8, { message: '新密码至少 8 位' })
  @MaxLength(128, { message: '新密码不能超过 128 位' })
  newPassword!: string
}

/** 管理员用户列表筛选条件。 */
export class AdminUserQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsIn(['0', '1'])
  status?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number
}

/** 管理员启用或停用账号。 */
export class UpdateUserStatusDto {
  @IsIn([0, 1])
  status!: 0 | 1
}
