import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards
} from '@nestjs/common'
import { SessionGuard } from '../../common/session.guard'
import { RolesGuard, Roles } from '../../common/roles.guard'
import { CurrentUser } from '../../common/current-user.decorator'
import type { RequestUser } from '../../common/request-user'
import { SiteConfigService } from './site-config.service'
import { BannerService } from './banner.service'
import { StatsService } from './stats.service'
import { CreateBannerDto } from './dto/create-banner.dto'
import { UpdateBannerDto } from './dto/update-banner.dto'
import { UpdateBannerStatusDto } from './dto/update-banner-status.dto'
import { BannerSortDto } from './dto/banner-sort.dto'

/**
 * 站点配置 / Banner / 概览管理接口（MVP-07）。
 * 路由契约冻结于 docs/operation-contract.md。
 */
@Controller('admin')
@UseGuards(SessionGuard, RolesGuard)
@Roles('ADMIN')
export class AdminOperationController {
  constructor(
    private readonly siteConfigService: SiteConfigService,
    private readonly bannerService: BannerService,
    private readonly statsService: StatsService
  ) {}

  // ============================== 站点配置 ==============================

  @Get('site/config')
  getSiteConfig() {
    return this.siteConfigService.getPublicConfig()
  }

  @Put('site/config')
  updateSiteConfig(
    @Body() body: Record<string, unknown>,
    @CurrentUser() user: RequestUser | null
  ) {
    // body 以 Object 接收（ValidationPipe 不剥离未知键），由服务层显式拒绝非白名单键。
    return this.siteConfigService.updateConfig(body ?? {}, user?.id ?? '')
  }

  // ============================== Banner 管理 ==============================

  @Get('banners')
  adminListBanners() {
    return this.bannerService.adminList()
  }

  @Post('banners')
  createBanner(@Body() dto: CreateBannerDto) {
    return this.bannerService.adminCreate(dto)
  }

  // 注意：sort 必须声明在 :id 之前，避免被 :id 路由吞掉。
  @Put('banners/sort')
  sortBanners(@Body() dto: BannerSortDto) {
    return this.bannerService.adminSort(dto.items)
  }

  @Put('banners/:id')
  updateBanner(@Param('id') id: string, @Body() dto: UpdateBannerDto) {
    return this.bannerService.adminUpdate(id, dto)
  }

  @Put('banners/:id/status')
  updateBannerStatus(@Param('id') id: string, @Body() dto: UpdateBannerStatusDto) {
    return this.bannerService.adminUpdateStatus(id, dto.isActive)
  }

  @Delete('banners/:id')
  async deleteBanner(@Param('id') id: string) {
    await this.bannerService.adminDelete(id)
    return { success: true }
  }

  // ============================== 后台概览 ==============================

  @Get('stats/overview')
  getOverview() {
    return this.statsService.getOverview()
  }
}
