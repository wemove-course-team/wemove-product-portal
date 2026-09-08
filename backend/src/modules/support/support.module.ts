import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportController, AdminSupportController } from './support.controller';
import { SupportService } from './support.service';
import { SupportMessage, SupportFaq, SupportManual } from './support.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([
            SupportMessage,
            SupportFaq,
            SupportManual,
        ]),
    ],
    controllers: [
        SupportController,      // C 端前台接口 (/api/v1/support/...)
        AdminSupportController, // B 端后台管理接口 (/api/v1/admin/support/...)
    ],
    providers: [SupportService],
    exports: [SupportService, TypeOrmModule],
})
export class SupportModule { }