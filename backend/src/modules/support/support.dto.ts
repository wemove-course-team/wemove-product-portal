import { Type } from 'class-transformer'
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator'
import { DownloadVisibility, FaqStatus, MessageStatus } from './support.entity'

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/\S/, { message: '姓名不能为空' })
  name!: string

  @IsEmail()
  @MaxLength(128)
  @Matches(/\S/, { message: '邮箱不能为空' })
  email!: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/\S/, { message: '主题不能为空' })
  subject!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
  @Matches(/\S/, { message: '留言内容不能为空' })
  content!: string
}

export class MessageQueryDto {
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

  @IsOptional()
  @IsEnum(MessageStatus)
  status?: MessageStatus

  @IsOptional()
  @IsString()
  @MaxLength(64)
  keyword?: string
}

export class UpdateMessageStatusDto {
  @IsEnum(MessageStatus)
  status!: MessageStatus

  @IsOptional()
  @IsString()
  @MaxLength(255)
  handleNote?: string
}

export class CreateFaqDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/\S/, { message: '问题不能为空' })
  question!: string

  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: '答案不能为空' })
  answer!: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsEnum(FaqStatus)
  status?: FaqStatus
}

export class UpdateFaqDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/\S/, { message: '问题不能为空' })
  question?: string

  @IsOptional()
  @IsString()
  @Matches(/\S/, { message: '答案不能为空' })
  answer?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsEnum(FaqStatus)
  status?: FaqStatus
}

export class CreateDownloadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/\S/, { message: '标题不能为空' })
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/\S/, { message: '分类不能为空' })
  category!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^(\/(?!\/)|https?:\/\/[^\s]+$)/, { message: '文件地址必须是站内路径或 http(s) 地址' })
  fileUrl!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^(\/(?!\/)|https?:\/\/[^\s]+$)/, { message: '封面地址必须是站内路径或 http(s) 地址' })
  coverImage?: string

  @IsOptional()
  @IsEnum(DownloadVisibility)
  visibility?: DownloadVisibility

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsEnum(FaqStatus)
  status?: FaqStatus
}

export class UpdateDownloadDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/\S/, { message: '标题不能为空' })
  title?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  category?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^(\/(?!\/)|https?:\/\/[^\s]+$)/, { message: '文件地址必须是站内路径或 http(s) 地址' })
  fileUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Matches(/^(\/(?!\/)|https?:\/\/[^\s]+$)/, { message: '封面地址必须是站内路径或 http(s) 地址' })
  coverImage?: string

  @IsOptional()
  @IsEnum(DownloadVisibility)
  visibility?: DownloadVisibility

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number

  @IsOptional()
  @IsEnum(FaqStatus)
  status?: FaqStatus
}
