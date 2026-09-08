import { IsString, IsOptional, IsIn, MaxLength, IsNotEmpty, Matches } from 'class-validator'
import type { ArticleStatus } from '../entities/article.entity'

export class CreateArticleDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  title: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(128)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug 必须由小写字母、数字与连字符组成，且不能以连字符开头或结尾'
  })
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
