import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CommonModule } from '../../common/common.module'
import { User } from '../identity/user.entity'
import { DealerApplication } from './dealer-application.entity'
import { DealerCompany } from './dealer-company.entity'
import { DealerAdminController, DealerController } from './dealer.controller'
import { DealerService } from './dealer.service'

/** 经销商申请、审核和门户模块。 */
@Module({
  imports: [TypeOrmModule.forFeature([User, DealerApplication, DealerCompany]), CommonModule],
  controllers: [DealerController, DealerAdminController],
  providers: [DealerService]
})
export class DealerModule {}
