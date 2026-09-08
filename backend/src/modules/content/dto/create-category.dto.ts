import { IsString, IsNotEmpty, MaxLength, IsInt, IsOptional, Matches } from 'class-validator'
import { Type } from 'class-transformer'

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  name: string

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug 必须由小写字母、数字与连字符组成，且不能以连字符开头或结尾'
  })
  slug: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number = 0
}
