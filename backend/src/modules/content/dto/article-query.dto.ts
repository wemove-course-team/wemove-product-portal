import { IsOptional, IsString, IsInt, Min, Max, IsIn } from 'class-validator'
import { Type } from 'class-transformer'
import type { ArticleStatus } from '../entities/article.entity'

export class ArticleQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  pageSize?: number = 10

  @IsOptional()
  @IsString()
  categoryId?: string

  @IsOptional()
  @IsString()
  keyword?: string
}

export class AdminArticleQueryDto extends ArticleQueryDto {
  @IsOptional()
  @IsString()
  @IsIn(['DRAFT', 'PUBLISHED', 'OFFLINE'])
  status?: ArticleStatus
}
