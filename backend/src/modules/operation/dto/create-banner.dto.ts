import { IsBoolean, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator'

/** POST /admin/banners 请求体。URL 合法性（相对路径 / http(s)）由服务层校验。 */
export class CreateBannerDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 128)
  title!: string

  @IsString()
  @IsNotEmpty()
  @Length(1, 255)
  imageUrl!: string

  @IsOptional()
  @IsString()
  @Length(0, 255)
  linkUrl?: string | null

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
