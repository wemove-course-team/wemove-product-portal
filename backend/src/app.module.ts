import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AuthModule } from './modules/identity/auth.module'
import { User } from './modules/identity/user.entity'
import { DealerModule } from './modules/dealer/dealer.module'
import { DealerApplication } from './modules/dealer/dealer-application.entity'
import { DealerCompany } from './modules/dealer/dealer-company.entity'
import { HealthController } from './health.controller'

@Module({ imports: [ConfigModule.forRoot({ isGlobal: true }), TypeOrmModule.forRootAsync({ inject: [ConfigService], useFactory: (config: ConfigService) => ({ type: 'mysql', host: config.get('DB_HOST', 'localhost'), port: Number(config.get('DB_PORT', 3306)), username: config.get('DB_USERNAME', 'root'), password: config.get('DB_PASSWORD', ''), database: config.get('DB_DATABASE', 'wemove_portal'), entities: [User, DealerApplication, DealerCompany], synchronize: false, logging: config.get('DB_LOGGING', 'false') === 'true' }) }), AuthModule, DealerModule], controllers: [HealthController] })
export class AppModule {}
