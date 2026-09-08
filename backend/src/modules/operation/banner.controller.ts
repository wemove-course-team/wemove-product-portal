import { Controller, Get } from '@nestjs/common'
import { BannerService } from './banner.service'

/** 公开 Banner 列表：仅启用项，按 sortOrder、id 稳定排序。 */
@Controller('banners')
export class BannerController {
  constructor(private readonly bannerService: BannerService) {}

  @Get()
  listPublic() {
    return this.bannerService.listPublic()
  }
}
