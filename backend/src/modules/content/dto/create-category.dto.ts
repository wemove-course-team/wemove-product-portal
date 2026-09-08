import { IsString, IsNotEmpty, MaxLength, IsInt, IsOptional } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  slug: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number = 0
}
