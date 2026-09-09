import { IsInt, IsOptional, IsString, Length, Matches, Min, Validate } from 'class-validator'
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments
} from 'class-validator'
import type { CreateBannerDto } from './create-banner.dto'

/**
 * 编辑接口禁止携带 isActive：启停只能走 PUT /admin/banners/:id/status，
 * 避免“200 但状态未变”的假成功。
 */
@ValidatorConstraint({ name: 'isActiveForbiddenOnEdit' })
class IsActiveForbiddenOnEdit implements ValidatorConstraintInterface {
  validate(): boolean {
    return false
  }

  defaultMessage(args: ValidationArguments): string {
    return `启停请使用 PUT /admin/banners/:id/status，编辑接口不接受 ${args.property}`
  }
}

/** PUT /admin/banners/:id 请求体（部分更新，不含 isActive）。 */
export class UpdateBannerDto implements Partial<CreateBannerDto> {
  @IsOptional()
  @IsString()
  @Length(1, 128)
  @Matches(/\S/, { message: '标题不能为空' })
  title?: string

  @IsOptional()
  @IsString()
  @Length(1, 255)
  imageUrl?: string

  @IsOptional()
  @IsString()
  @Length(0, 255)
  linkUrl?: string | null

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number

  @IsOptional()
  @Validate(IsActiveForbiddenOnEdit)
  isActive?: boolean
}
