import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SiteConfig } from './site-config.entity'
import { Banner } from './banner.entity'
import { SiteConfigService } from './site-config.service'
import { BannerService } from './banner.service'
import { StatsService } from './stats.service'
import { SiteConfigController } from './site-config.controller'
import { BannerController } from './banner.controller'
import { AdminOperationController } from './admin-operation.controller'

/** MVP-07 运营域：站点配置、Banner 与后台概览统计。 */
@Module({
  imports: [TypeOrmModule.forFeature([SiteConfig, Banner])],
  controllers: [SiteConfigController, BannerController, AdminOperationController],
  providers: [SiteConfigService, BannerService, StatsService]
})
export class OperationModule {}
