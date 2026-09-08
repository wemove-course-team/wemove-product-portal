import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '../../common/common.module'
import { AdminSupportController, PublicSupportController, SupportController } from './support.controller'
import { SupportDownload, SupportFaq, SupportMessage } from './support.entity'
import { SupportService } from './support.service'

/** 联系、FAQ 与下载支持中心。 */
@Module({
  imports: [TypeOrmModule.forFeature([SupportMessage, SupportFaq, SupportDownload]), CommonModule],
  controllers: [SupportController, PublicSupportController, AdminSupportController],
  providers: [SupportService]
})
export class SupportModule {}
