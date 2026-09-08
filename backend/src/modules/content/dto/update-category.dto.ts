import { IsString, MaxLength, IsInt, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  name?: string

  @IsOptional()
  @IsString()
  @MaxLength(64)
  slug?: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number
}
