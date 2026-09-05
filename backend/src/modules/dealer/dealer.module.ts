import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from '../identity/auth.module'
import { User } from '../identity/user.entity'
import { SessionGuard } from '../identity/auth.guard'
import { DealerApplication } from './dealer-application.entity'
import { DealerCompany } from './dealer-company.entity'
import { DealerAdminController, DealerController } from './dealer.controller'
import { DealerService } from './dealer.service'

@Module({ imports: [TypeOrmModule.forFeature([User, DealerApplication, DealerCompany]), AuthModule], controllers: [DealerController, DealerAdminController], providers: [DealerService, SessionGuard] })
export class DealerModule {}
