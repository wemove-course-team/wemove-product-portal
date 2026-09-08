import { Controller, Get } from '@nestjs/common'
import { SiteConfigService } from './site-config.service'

/** 公开站点配置：前台 Header/Footer 消费。 */
@Controller('site')
export class SiteConfigController {
  constructor(private readonly siteConfigService: SiteConfigService) {}

  @Get('config')
  getPublicConfig() {
    return this.siteConfigService.getPublicConfig()
  }
}
