import { Type } from 'class-transformer'
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'
import { DownloadVisibility, FaqStatus, MessageStatus } from './support.entity'

export class CreateMessageDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name!: string

  @IsEmail()
  @MaxLength(128)
  email!: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  phone?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  subject!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(5000)
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
  question!: string

  @IsString()
  @IsNotEmpty()
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

export class UpdateFaqDto extends CreateFaqDto {}

export class CreateDownloadDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  title!: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  category!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fileUrl!: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
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

export class UpdateDownloadDto extends CreateDownloadDto {}
