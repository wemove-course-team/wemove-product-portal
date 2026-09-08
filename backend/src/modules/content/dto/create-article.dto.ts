import { IsString, IsOptional, IsIn, MaxLength, IsNotEmpty } from 'class-validator'
import type { ArticleStatus } from '../entities/article.entity'

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  title: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  slug: string

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsString()
  @MaxLength(255)
  coverImage?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  summary?: string

  @IsOptional()
  @IsString()
  content?: string

  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'PUBLISHED', 'OFFLINE'])
  status?: ArticleStatus = 'DRAFT'
}
