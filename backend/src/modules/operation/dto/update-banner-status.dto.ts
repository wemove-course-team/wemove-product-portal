import { IsBoolean } from 'class-validator'

/** PUT /admin/banners/:id/status 请求体（启停）。 */
export class UpdateBannerStatusDto {
  @IsBoolean()
  isActive!: boolean
}
