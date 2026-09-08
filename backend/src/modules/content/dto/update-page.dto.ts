import { IsString, MaxLength, IsOptional, IsIn } from 'class-validator'
import type { PageStatus } from '../entities/page.entity'

export class UpdatePageDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  title?: string

  @IsOptional()
  @IsString()
  sectionsJson?: string

  @IsOptional()
  @IsString()
  @IsIn(['PUBLISHED', 'DRAFT'])
  status?: PageStatus
}
