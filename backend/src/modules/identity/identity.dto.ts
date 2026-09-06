import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator'

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

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: '请输入用户名或邮箱' })
  identifier!: string

  @IsString()
  @IsNotEmpty({ message: '请输入密码' })
  password!: string
}

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

export class ChangePasswordDto {
  @IsString()
  @IsNotEmpty({ message: '请输入当前密码' })
  oldPassword!: string

  @IsString()
  @MinLength(8, { message: '新密码至少 8 位' })
  @MaxLength(128, { message: '新密码不能超过 128 位' })
  newPassword!: string
}

export class RequestPasswordResetDto {
  @IsEmail({}, { message: '请输入有效邮箱' })
  email!: string
}

export class ConfirmPasswordResetDto {
  @IsString()
  @IsNotEmpty({ message: '请输入重置 token' })
  token!: string

  @IsString()
  @MinLength(8, { message: '新密码至少 8 位' })
  @MaxLength(128, { message: '新密码不能超过 128 位' })
  newPassword!: string
}

export class AdminUserQueryDto {
  @IsOptional()
  @IsString()
  keyword?: string

  @IsOptional()
  @IsIn(['0', '1'])
  status?: string

  @IsOptional()
  page?: number

  @IsOptional()
  pageSize?: number
}

export class UpdateUserStatusDto {
  @IsIn([0, 1])
  status!: 0 | 1
}
