import { IsArray, ArrayNotEmpty, IsInt, Min, ValidateNested } from 'class-validator'
import { Type } from 'class-transformer'

/** 批量排序中的单项。 */
export class BannerSortItemDto {
  @Type(() => Number)
  @IsInt()
  id!: number

  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder!: number
}

/** PUT /admin/banners/sort 请求体。 */
export class BannerSortDto {
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BannerSortItemDto)
  items!: BannerSortItemDto[]
}
